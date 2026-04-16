import http from "http";
import {
  approvalState,
  approvePendingApplication,
  rejectPendingApplication,
  setPendingApplication,
  type PendingApplication
} from "../state/approvalState.js";
import { APPROVAL_PREVIEW_MAX_BODY_BYTES, APPROVAL_UI_PORT } from "./config.js";

let isStarted = false;

function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    let rejected = false;
    req.on("data", (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > APPROVAL_PREVIEW_MAX_BODY_BYTES) {
        rejected = true;
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      raw += chunk.toString();
    });
    req.on("end", () => {
      if (rejected) return;
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: Record<string, any>): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage(application: PendingApplication | null): string {
  const content = application
    ? `
      <div class="meta-row"><span>Job title</span><strong>${escapeHtml(application.job.title)}</strong></div>
      <div class="meta-row"><span>Company</span><strong>${escapeHtml(application.job.company)}</strong></div>
      <div class="meta-row"><span>Recipient</span><strong>${escapeHtml(application.job.email)}</strong></div>
      <h2>Cover letter preview</h2>
      <div class="letter">${escapeHtml(application.coverLetter)}</div>
      <div class="actions">
        <button id="approve" class="btn btn-approve">Approve &amp; Send</button>
        <button id="reject" class="btn btn-reject">Reject</button>
      </div>
      <p id="status" class="status"></p>
    `
    : `
      <h2>No pending application</h2>
      <p class="muted">The next generated cover letter preview will appear here.</p>
      <p id="status" class="status"></p>
    `;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Application Approval</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, Arial, sans-serif;
      background: linear-gradient(180deg, #f6f8fc 0%, #eef2f9 100%);
      color: #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 760px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
      padding: 28px;
    }
    h1 {
      margin: 0 0 18px;
      font-size: 24px;
    }
    h2 {
      margin: 22px 0 10px;
      font-size: 18px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 10px 0;
      border-bottom: 1px solid #edf0f5;
      font-size: 15px;
    }
    .meta-row span {
      color: #6b7280;
    }
    .letter {
      margin-top: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
      padding: 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 18px;
    }
    .btn {
      border: 0;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-approve {
      background: #16a34a;
      color: #fff;
    }
    .btn-reject {
      background: #ef4444;
      color: #fff;
    }
    .status {
      margin-top: 12px;
      font-size: 14px;
      color: #334155;
    }
    .muted {
      color: #64748b;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>Email Approval Preview</h1>
    ${content}
  </main>
  <script>
    async function sendDecision(path, successMessage) {
      try {
        const response = await fetch(path, { method: "POST" });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Request failed");
        }
        const status = document.getElementById("status");
        if (status) status.textContent = successMessage;
        setTimeout(() => window.location.reload(), 700);
      } catch (err) {
        const status = document.getElementById("status");
        const message = err instanceof Error ? err.message : "unknown error";
        if (status) status.textContent = "Action failed: " + message;
      }
    }
    const approveBtn = document.getElementById("approve");
    if (approveBtn) approveBtn.addEventListener("click", () => sendDecision("/approve", "Approved. Sending in progress..."));
    const rejectBtn = document.getElementById("reject");
    if (rejectBtn) rejectBtn.addEventListener("click", () => sendDecision("/reject", "Application rejected."));
  </script>
</body>
</html>`;
}

async function handlePreview(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const body = await readJsonBody<{ job?: PendingApplication["job"]; coverLetter?: string }>(req);
    if (!body?.job || typeof body.coverLetter !== "string") {
      sendJson(res, 400, { error: "Invalid payload. Expected { job, coverLetter }" });
      return;
    }
    if (
      typeof body.job.title !== "string" ||
      typeof body.job.company !== "string" ||
      typeof body.job.email !== "string" ||
      !body.job.title.trim() ||
      !body.job.company.trim() ||
      !body.job.email.trim()
    ) {
      sendJson(res, 400, { error: "Invalid job payload" });
      return;
    }
    const accepted = setPendingApplication({
      job: {
        title: body.job.title.trim(),
        company: body.job.company.trim(),
        email: body.job.email.trim()
      },
      coverLetter: body.coverLetter
    });
    if (!accepted) {
      sendJson(res, 409, { error: "A pending application already exists" });
      return;
    }
    sendJson(res, 200, { ok: true });
  } catch (err: any) {
    if (err?.message === "Request body too large") {
      sendJson(res, 413, { error: "Request body too large" });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON body" });
  }
}

export async function startApprovalServer(): Promise<void> {
  if (isStarted) return;

  const server = http.createServer(async (req, res) => {
    const method = req.method || "GET";
    const path = req.url || "/";

    if (method === "GET" && path === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderPage(approvalState.pendingApplication));
      return;
    }

    if (method === "POST" && path === "/preview") {
      await handlePreview(req, res);
      return;
    }

    if (method === "POST" && path === "/approve") {
      const approved = approvePendingApplication();
      if (!approved) {
        sendJson(res, 409, { error: "No pending application to approve" });
        return;
      }
      sendJson(res, 200, { ok: true, approved: true });
      return;
    }

    if (method === "POST" && path === "/reject") {
      const rejected = rejectPendingApplication();
      if (!rejected) {
        sendJson(res, 409, { error: "No pending application to reject" });
        return;
      }
      sendJson(res, 200, { ok: true, rejected: true });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(APPROVAL_UI_PORT, () => {
      isStarted = true;
      console.log(`🌐 Approval UI running at http://localhost:${APPROVAL_UI_PORT}`);
      resolve();
    });
  });
}
