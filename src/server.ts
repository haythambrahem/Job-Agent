import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { sendApplicationEmail } from "./tools/gmail.js";
import { searchJobs } from "./tools/linkedin.js";
import { generateCoverLetter } from "./tools/cv.js";
import "dotenv/config";

const server = new Server(
  { name: "job-agent-free", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_jobs",
      description: "Cherche des offres d'emploi sur LinkedIn",
      inputSchema: { type: "object", properties: { keywords: { type: "string" }, location: { type: "string" } }, required: ["keywords"] }
    },
    {
      name: "generate_cover_letter",
      description: "Génère une lettre de motivation avec Groq AI (gratuit)",
      inputSchema: { type: "object", properties: { job_title: { type: "string" }, company: { type: "string" }, job_description: { type: "string" }, cv_summary: { type: "string" } }, required: ["job_title", "company", "job_description"] }
    },
    {
      name: "send_application",
      description: "Envoie une candidature par Gmail",
      inputSchema: { type: "object", properties: { to_email: { type: "string" }, company: { type: "string" }, job_title: { type: "string" }, cover_letter: { type: "string" } }, required: ["to_email", "company", "job_title", "cover_letter"] }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async ({ params: { name, arguments: args } }) => {
  if (name === "search_jobs") return { content: [{ type: "text", text: await searchJobs(args as any) }] };
  if (name === "generate_cover_letter") return { content: [{ type: "text", text: await generateCoverLetter(args as any) }] };
  if (name === "send_application") return { content: [{ type: "text", text: await sendApplicationEmail(args as any) }] };
  throw new Error(`Outil inconnu: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Job Agent MCP démarré !");
}

main().catch(console.error);