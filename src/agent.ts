import Groq from "groq-sdk";
import { sendApplicationEmail } from "./tools/gmail.js";
import { searchJobs } from "./tools/linkedin.js";
import { generateCoverLetter } from "./tools/cv.js";
import { getCandidatures, saveCandidature } from "./tools/tracker.js";
import readline from "readline";
import open from "open";
import { approvalState, resetApprovalState } from "./state/approvalState.js";
import { startApprovalServer } from "./ui/server.js";
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

type ToolName =
  | "search_jobs"
  | "generate_cover_letter"
  | "send_application"
  | "save_candidature"
  | "get_candidatures";

type SendApplicationArgs = {
  to_email: string;
  company: string;
  job_title: string;
  cover_letter: string;
};

const REQUIRED_ARGS: Record<string, string[]> = {
  search_jobs: ["keywords"],
  generate_cover_letter: ["job_title", "company", "job_description"],
  send_application: ["to_email", "company", "job_title", "cover_letter"],
  save_candidature: ["to_email", "company", "job_title"],
  get_candidatures: []
};

const ARG_TYPES: Record<string, Record<string, "string">> = {
  search_jobs: { keywords: "string", location: "string" },
  generate_cover_letter: { job_title: "string", company: "string", job_description: "string", cv_summary: "string" },
  send_application: { to_email: "string", company: "string", job_title: "string", cover_letter: "string" },
  save_candidature: { to_email: "string", company: "string", job_title: "string" },
  get_candidatures: {}
};

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();
  const hasWord = (pattern: string): boolean => new RegExp(`\\b${pattern}\\b`, "i").test(text);

  if (
    text.includes("mes candidatures") ||
    hasWord("history") ||
    hasWord("historique") ||
    hasWord("applications") ||
    hasWord("application")
  ) {
    return "history";
  }

  if (
    hasWord("postule") ||
    hasWord("postuler") ||
    hasWord("apply") ||
    text.includes("send application") ||
    text.includes("envoie ma candidature")
  ) {
    return "apply";
  }

  if (
    hasWord("cherche") ||
    text.includes("find jobs") ||
    hasWord("offres") ||
    hasWord("offre") ||
    text.includes("tanitjobs") ||
    text.includes("matching cv")
  ) {
    return "search";
  }

  return "unknown";
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
    if (!(key in args)) {
      return { valid: false, reason: `missing required argument: ${key}` };
    }
    if (ARG_TYPES[name]?.[key] === "string") {
      if (typeof args[key] !== "string") {
        return { valid: false, reason: `missing or invalid required argument: ${key}` };
      }
      if (!args[key].trim()) {
        return { valid: false, reason: `missing or invalid required argument: ${key}` };
      }
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

function getIntentBlockedToolReason(intent: Intent, toolName: string): string | null {
  if (intent === "search" && toolName !== "search_jobs") {
    return "Invalid tool selection: search intent cannot trigger apply tools";
  }
  if (intent === "history" && toolName !== "get_candidatures") {
    return "Invalid tool selection: history intent only allows get_candidatures";
  }
  if (intent === "apply" && !["generate_cover_letter", "send_application", "save_candidature"].includes(toolName)) {
    return "Invalid tool selection: apply intent only allows apply pipeline tools";
  }
  return null;
}

async function postPreview(args: SendApplicationArgs, coverLetter: string): Promise<void> {
  const response = await fetch("http://localhost:3000/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job: {
        title: args.job_title,
        company: args.company,
        email: args.to_email
      },
      coverLetter
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Preview API call failed");
  }
}

async function waitForDecision(): Promise<"approved" | "rejected"> {
  while (true) {
    if (approvalState.decision === "approved") return "approved";
    if (approvalState.decision === "rejected") return "rejected";
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function requestForcedToolCall(
  messages: any[],
  userMessage: string,
  intent: Intent,
  forcedTool: ToolName
): Promise<{ ok: true; choiceMessage: any; call: any } | { ok: false; error: string }> {
  let toolUseFailedRetryAttempted = false;

  while (true) {
    let response: any;
    try {
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools,
        tool_choice: {
          type: "function",
          function: { name: forcedTool }
        },
        max_tokens: 2000
      });
    } catch (err: any) {
      logToolDebug(userMessage, intent, forcedTool, err?.error ?? err);
      if (isToolUseFailedError(err) && !toolUseFailedRetryAttempted) {
        toolUseFailedRetryAttempted = true;
        const requiredArgs = REQUIRED_ARGS[forcedTool].join(", ") || "none";
        messages.push({
          role: "system",
          content: `Retry after tool_use_failed. Intent=${intent}. You must call only ${forcedTool} with a valid JSON object. Required arguments: ${requiredArgs}. Return exactly one tool call.`
        });
        continue;
      }
      return { ok: false, error: "❌ Erreur Groq lors de l'appel outil. Vérifie les champs requis puis réessaie." };
    }

    const choice = response.choices[0];
    if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls?.length) {
      logToolDebug(userMessage, intent, forcedTool, { reason: "missing_tool_call", choice });
      return { ok: false, error: choice.message.content || "Je n'ai pas trouvé d'action à effectuer." };
    }

    const call = choice.message.tool_calls[0];
    if (call.function.name !== forcedTool) {
      logToolDebug(userMessage, intent, call.function.name, {
        reason: `forced tool mismatch, expected ${forcedTool}`,
        arguments: call.function.arguments
      });
      return { ok: false, error: `❌ Outil inattendu reçu (${call.function.name}). Outil attendu: ${forcedTool}.` };
    }

    return { ok: true, choiceMessage: choice.message, call };
  }
}

function parseAndValidateCall(
  call: any,
  userMessage: string,
  intent: Intent
): { ok: true; name: ToolName; args: Record<string, any> } | { ok: false; error: string } {
  const toolName = call.function.name as ToolName;
  const blockedReason = getIntentBlockedToolReason(intent, toolName);
  if (blockedReason) {
    console.error(blockedReason);
    logToolDebug(userMessage, intent, toolName, { reason: blockedReason, arguments: call.function.arguments });
    return { ok: false, error: `TOOL_BLOCKED: ${blockedReason}` };
  }

  const parsed = parseToolArgs(call.function.arguments);
  if (!parsed.ok) {
    logToolDebug(userMessage, intent, toolName, { arguments: call.function.arguments, error: parsed.error });
    return { ok: false, error: `INVALID_TOOL_ARGS: ${parsed.error}` };
  }

  const validation = validateToolArgs(toolName, parsed.value);
  if (!validation.valid) {
    logToolDebug(userMessage, intent, toolName, { args: parsed.value, error: validation.reason });
    return { ok: false, error: `INVALID_TOOL_ARGS: ${validation.reason}` };
  }

  return { ok: true, name: toolName, args: parsed.value };
}

async function runSearchMode(userMessage: string, messages: any[]): Promise<string> {
  const forced = await requestForcedToolCall(messages, userMessage, "search", "search_jobs");
  if (!forced.ok) return forced.error;

  messages.push(forced.choiceMessage);
  const parsed = parseAndValidateCall(forced.call, userMessage, "search");
  if (!parsed.ok) return parsed.error;

  const result = await runTool(parsed.name, parsed.args);
  console.log(`   ✅ ${result.substring(0, 80)}`);
  return result;
}

async function runHistoryMode(userMessage: string, messages: any[]): Promise<string> {
  const forced = await requestForcedToolCall(messages, userMessage, "history", "get_candidatures");
  if (!forced.ok) return forced.error;

  messages.push(forced.choiceMessage);
  const parsed = parseAndValidateCall(forced.call, userMessage, "history");
  if (!parsed.ok) return parsed.error;

  const result = await runTool(parsed.name, parsed.args);
  console.log(`   ✅ ${result.substring(0, 80)}`);
  return result;
}

async function runApplyMode(userMessage: string, messages: any[]): Promise<string> {
  const coverStep = await requestForcedToolCall(messages, userMessage, "apply", "generate_cover_letter");
  if (!coverStep.ok) return coverStep.error;
  messages.push(coverStep.choiceMessage);

  const parsedCover = parseAndValidateCall(coverStep.call, userMessage, "apply");
  if (!parsedCover.ok) return parsedCover.error;

  const coverLetter = await runTool(parsedCover.name, parsedCover.args);
  console.log(`   ✅ ${coverLetter.substring(0, 80)}`);
  messages.push({ role: "tool", tool_call_id: coverStep.call.id, content: coverLetter });

  const sendStep = await requestForcedToolCall(messages, userMessage, "apply", "send_application");
  if (!sendStep.ok) return sendStep.error;
  messages.push(sendStep.choiceMessage);

  const parsedSend = parseAndValidateCall(sendStep.call, userMessage, "apply");
  if (!parsedSend.ok) return parsedSend.error;
  const sendArgs: SendApplicationArgs = { ...parsedSend.args, cover_letter: coverLetter } as SendApplicationArgs;
  const sendValidation = validateToolArgs("send_application", sendArgs);
  if (!sendValidation.valid) {
    logToolDebug(userMessage, "apply", "send_application", { args: sendArgs, error: sendValidation.reason });
    return `INVALID_TOOL_ARGS: ${sendValidation.reason}`;
  }

  await postPreview(sendArgs, coverLetter);
  await open("http://localhost:3000");

  const decision = await waitForDecision();
  if (decision !== "approved") {
    resetApprovalState();
    return "❌ Application cancelled by user";
  }

  const sendResult = await runTool("send_application", sendArgs);
  console.log(`   ✅ ${sendResult.substring(0, 80)}`);
  if (sendResult.startsWith("Échec outil send_application")) {
    resetApprovalState();
    return sendResult;
  }
  messages.push({ role: "tool", tool_call_id: sendStep.call.id, content: sendResult });

  const saveArgs = {
    to_email: sendArgs.to_email,
    company: sendArgs.company,
    job_title: sendArgs.job_title
  };
  const saveValidation = validateToolArgs("save_candidature", saveArgs);
  if (!saveValidation.valid) {
    logToolDebug(userMessage, "apply", "save_candidature", { args: saveArgs, error: saveValidation.reason });
    resetApprovalState();
    return `INVALID_TOOL_ARGS: ${saveValidation.reason}`;
  }

  const saveResult = await runTool("save_candidature", saveArgs);
  console.log(`   ✅ ${saveResult.substring(0, 80)}`);
  resetApprovalState();
  return `✅ Candidature envoyée chez ${String(sendArgs.company ?? "entreprise")}`;
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

  if (intent === "search") {
    return runSearchMode(userMessage, messages);
  }
  if (intent === "apply") {
    return runApplyMode(userMessage, messages);
  }
  if (intent === "history") {
    return runHistoryMode(userMessage, messages);
  }
  return "Intention non reconnue. Utilise par exemple: 'find jobs matching my CV', 'apply to this job', ou 'show my applications'.";
}

async function main() {
  await startApprovalServer();

  console.log("╔══════════════════════════════╗");
  console.log("║   🚀 Job Application Agent   ║");
  console.log("╚══════════════════════════════╝");
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
