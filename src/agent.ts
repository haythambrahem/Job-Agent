import Groq from "groq-sdk";
import { sendApplicationEmail } from "./tools/gmail.js";
import { searchJobs } from "./tools/linkedin.js";
import { generateCoverLetter } from "./tools/cv.js";
import { saveCandidature } from "./tools/tracker.js";
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
  }
];

async function runTool(name: string, args: any): Promise<string> {
  console.log(`\n🔧 ${name}...`);
  switch (name) {
    case "search_jobs":           return await searchJobs(args);
    case "generate_cover_letter": return await generateCoverLetter(args);
    case "send_application":      return await sendApplicationEmail(args);
    case "save_candidature":      return await saveCandidature(args);
    default: return `Outil inconnu: ${name}`;
  }
}

async function chat(userMessage: string, history: any[]): Promise<string> {
  const messages: any[] = [
    {
  role: "system",
  content: `Tu es un agent de postulation. RÈGLES ABSOLUES :
1. Appelle les outils UN PAR UN, jamais ensemble.
2. Ordre STRICT pour une candidature : generate_cover_letter → send_application → save_candidature.
3. La valeur de "cover_letter" dans send_application = le TEXTE reçu de generate_cover_letter, JAMAIS un appel de fonction.
4. Après save_candidature → réponds UNIQUEMENT "✅ Candidature envoyée chez [entreprise]" et STOP.
5. Ne traite qu'UNE SEULE offre à la fois même si plusieurs sont trouvées.`
},
    ...history,
    { role: "user", content: userMessage }
  ];

  for (let step = 0; step < 15; step++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 2000
    });

    const choice = response.choices[0];
    if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls) {
      return choice.message.content || "";
    }

    messages.push(choice.message);

    for (const call of choice.message.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const result = await runTool(call.function.name, args);
      console.log(`   ✅ ${result.substring(0, 80)}`);
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
      // Pause pour éviter le rate limit Groq
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return "Tâche terminée.";
}

async function main() {
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