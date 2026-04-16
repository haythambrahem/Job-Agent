import Groq from "groq-sdk";
import { sendApplicationEmail } from "./tools/gmail.js";
import { searchJobs } from "./tools/linkedin.js";
import { generateCoverLetter } from "./tools/cv.js";
import { getCandidatures, saveCandidature } from "./tools/tracker.js";
import readline from "readline";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_jobs",
      description: "Cherche des offres d'emploi sur LinkedIn",
      parameters: {
        type: "object",
        properties: {
          keywords: { type: "string" },
          location: { type: "string" }
        },
        required: ["keywords"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_cover_letter",
      description: "Génère une lettre de motivation. Appelle EN PREMIER avant send_application.",
      parameters: {
        type: "object",
        properties: {
          job_title:       { type: "string" },
          company:         { type: "string" },
          job_description: { type: "string" },
          cv_summary:      { type: "string", description: "Laisser vide pour lire le CV automatiquement" }
        },
        required: ["job_title", "company", "job_description"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "send_application",
      description: "Envoie la candidature par Gmail. Utiliser APRÈS generate_cover_letter.",
      parameters: {
        type: "object",
        properties: {
          to_email:     { type: "string" },
          company:      { type: "string" },
          job_title:    { type: "string" },
          cover_letter: { type: "string", description: "Texte complet de la lettre reçu de generate_cover_letter" }
        },
        required: ["to_email", "company", "job_title", "cover_letter"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "save_candidature",
      description: "Sauvegarde la candidature dans Excel pour le suivi. Appeler après send_application.",
      parameters: {
        type: "object",
        properties: {
          to_email:  { type: "string" },
          company:   { type: "string" },
          job_title: { type: "string" }
        },
        required: ["to_email", "company", "job_title"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_candidatures",
      description: "Retrieve list of previously sent job applications",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

type Intent = "search" | "apply" | "history" | "unknown";

const REQUIRED_ARGS: Record<string, string[]> = {
  search_jobs: ["keywords"],
  generate_cover_letter: ["job_title", "company", "job_description"],
  send_application: ["to_email", "company", "job_title", "cover_letter"],
  save_candidature: ["to_email", "company", "job_title"],
  get_candidatures: []
};

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (
    text.includes("envoie") ||
    text.includes("postule") ||
    text.includes("postuler") ||
    text.includes("candidature à envoyer") ||
    text.includes("candidature a envoyer")
  ) {
    return "apply";
  }

  if (
    text.includes("cherche") ||
    text.includes("trouve") ||
    text.includes("offres") ||
    text.includes("offre")
  ) {
    return "search";
  }

  if (
    text.includes("candidature") ||
    text.includes("candidatures") ||
    text.includes("applications") ||
    text.includes("application") ||
    text.includes("mes candidatures") ||
    text.includes("historique") ||
    text.includes("history")
  ) {
    return "history";
  }

  return "unknown";
}

function getForcedTool(intent: Intent, step: number): string | null {
  if (step > 0) return null;
  if (intent === "history") return "get_candidatures";
  if (intent === "search") return "search_jobs";
  if (intent === "apply") return "generate_cover_letter";
  return null;
}

function parseToolArgs(rawArgs: string): { ok: true; value: Record<string, any> } | { ok: false; error: string } {
  try {
    const parsed = rawArgs ? JSON.parse(rawArgs) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "arguments must be a JSON object" };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "arguments are not valid JSON" };
  }
}

function validateToolArgs(name: string, args: Record<string, any>): { valid: true } | { valid: false; reason: string } {
  if (!(name in REQUIRED_ARGS)) {
    return { valid: false, reason: `unknown tool: ${name}` };
  }

  for (const key of REQUIRED_ARGS[name]) {
    if (typeof args[key] !== "string" || !args[key].trim()) {
      return { valid: false, reason: `missing or invalid required argument: ${key}` };
    }
  }

  return { valid: true };
}

function isToolUseFailedError(err: any): boolean {
  return err?.status === 400 && (err?.error?.code === "tool_use_failed" || String(err?.message || "").includes("tool_use_failed"));
}

function logToolDebug(userMessage: string, intent: Intent, selectedTool: string | null, payload: any): void {
  console.error("🐞 Tool debug:");
  console.error("   user message:", userMessage);
  console.error("   detected intent:", intent);
  console.error("   selected tool:", selectedTool ?? "none");
  console.error("   failed payload:", JSON.stringify(payload ?? {}, null, 2));
}

async function runTool(name: string, args: any): Promise<string> {
  console.log(`\n🔧 ${name}...`);
  try {
    switch (name) {
      case "search_jobs":           return await searchJobs(args);
      case "generate_cover_letter": return await generateCoverLetter(args);
      case "send_application":      return await sendApplicationEmail(args);
      case "save_candidature":      return await saveCandidature(args);
      case "get_candidatures":      return JSON.stringify(await getCandidatures(), null, 2);
      default: return `Outil inconnu: ${name}`;
    }
  } catch (err: any) {
    return `Échec outil ${name}: ${err?.message || "erreur inconnue"}`;
  }
}

async function chat(userMessage: string, history: any[]): Promise<string> {
  const intent = detectIntent(userMessage);
  const messages: any[] = [
    {
  role: "system",
  content: `Tu es un agent de postulation. RÈGLES ABSOLUES :
1. Appelle les outils UN PAR UN, jamais ensemble.
2. Ordre STRICT pour une candidature : generate_cover_letter → send_application → save_candidature.
3. La valeur de "cover_letter" dans send_application = le TEXTE reçu de generate_cover_letter, JAMAIS un appel de fonction.
4. Après save_candidature → réponds UNIQUEMENT "✅ Candidature envoyée chez [entreprise]" et STOP.
 5. Ne traite qu'UNE SEULE offre à la fois même si plusieurs sont trouvées.
 6. Si l'utilisateur veut chercher des offres, utilise search_jobs.
 7. Si l'utilisateur veut postuler, respecte strictement generate_cover_letter → send_application → save_candidature.
 8. Si l'utilisateur veut voir ses candidatures / applications / historique, utilise UNIQUEMENT get_candidatures.
 9. N'utilise JAMAIS search_jobs pour l'historique.
 10. N'invente jamais d'outil qui n'existe pas.`
},
    ...history,
    { role: "user", content: userMessage }
  ];

  let hasRetriedToolUseFailed = false;

  for (let step = 0; step < 15; step++) {
    const forcedTool = getForcedTool(intent, step);
    const selectedToolForRequest = forcedTool ?? "auto";
    let response: any;

    try {
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools,
        tool_choice: forcedTool
          ? {
              type: "function",
              function: { name: forcedTool }
            }
          : "auto",
        max_tokens: 2000
      });
    } catch (err: any) {
      logToolDebug(userMessage, intent, typeof selectedToolForRequest === "string" ? selectedToolForRequest : null, err?.error ?? err);
      if (isToolUseFailedError(err) && !hasRetriedToolUseFailed) {
        hasRetriedToolUseFailed = true;
        messages.push({
          role: "system",
          content: `Contexte corrigé: intention détectée = ${intent}. Pour historique utilise seulement get_candidatures; pour recherche utilise search_jobs; pour candidature respecte la séquence generate_cover_letter puis send_application puis save_candidature.`
        });
        continue;
      }
      return "❌ Je n'ai pas pu traiter la demande maintenant. Réessaie avec plus de détails.";
    }

    const choice = response.choices[0];
    if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls) {
      return choice.message.content || "Je n'ai pas trouvé d'action à effectuer.";
    }

    messages.push(choice.message);

    for (const call of choice.message.tool_calls) {
      let toolName = call.function.name;
      let args: Record<string, any> = {};

      if (toolName === "search_jobs" && intent === "history") {
        console.warn("⚠️ Tool call bloqué: search_jobs interdit pour un intent history. Reroutage vers get_candidatures.");
        toolName = "get_candidatures";
        args = {};
      } else {
        const parsed = parseToolArgs(call.function.arguments);
        if (!parsed.ok) {
          logToolDebug(userMessage, intent, call.function.name, { arguments: call.function.arguments, error: parsed.error });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `INVALID_TOOL_ARGS: ${parsed.error}. Réessaie avec un JSON objet valide.`
          });
          continue;
        }
        args = parsed.value;
      }

      const validation = validateToolArgs(toolName, args);
      if (!validation.valid) {
        logToolDebug(userMessage, intent, toolName, { args, error: validation.reason });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: `INVALID_TOOL_ARGS: ${validation.reason}. Corrige les paramètres et réessaie.`
        });
        continue;
      }

      const result = await runTool(toolName, args);
      console.log(`   ✅ ${result.substring(0, 80)}`);
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
      // Pause pour éviter le rate limit Groq
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return "Tâche terminée.";
}

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 Job Application Agent  (gratuit)  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("\n💡 Exemples de commandes :");
  console.log('   "Cherche des offres java en Tunisie"');
  console.log('   "Envoie ma candidature à jobs@example.com pour java Developer chez Startup"');
  console.log('   "Montre moi mes candidatures"\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const history: any[] = [];

  const ask = () => {
    rl.question("Toi: ", async (input) => {
      if (input.toLowerCase() === "exit") { rl.close(); return; }
      if (!input.trim()) { ask(); return; }
      try {
        console.log("\n🤔 Agent réfléchit...");
        const reply = await chat(input, history);
        history.push({ role: "user", content: input });
        history.push({ role: "assistant", content: reply });
        console.log(`\n🤖 Agent: ${reply}\n`);
      } catch (err: any) {
        console.error("❌ Erreur:", err.message);
      }
      ask();
    });
  };
  ask();
}

main().catch(console.error);
