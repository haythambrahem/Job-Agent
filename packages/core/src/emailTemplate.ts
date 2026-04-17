import type { CoverLetterContent } from "./coverLetter.js";

const SIGNATURE_BLOCK = `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:2px solid #0a66c2;padding-top:16px;font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;">
  <tr>
    <td>
      <strong style="font-size:16px;color:#0a66c2;">Haytham Brahem</strong><br/>
      <span style="color:#444;font-size:13px;">Full Stack Developer | Spring Boot &amp; Angular</span><br/><br/>
      <span>📞 <a href="tel:+21658101754" style="color:#1a1a1a;text-decoration:none;">+216 58 101 754</a></span><br/>
      <span>✉️ <a href="mailto:haythambrahem@gmail.com" style="color:#0a66c2;">haythambrahem@gmail.com</a></span><br/>
      <span>🔗 <a href="https://www.linkedin.com/in/haythambrahem" style="color:#0a66c2;">LinkedIn</a>
           &nbsp;|&nbsp;
           <a href="https://github.com/haythambrahem" style="color:#1a1a1a;">GitHub</a></span><br/>
      <span style="color:#666;font-size:12px;">📍 Cité El Ghazala 2, Raoued, Ariana 2083, Tunisie</span>
    </td>
  </tr>
</table>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailHtml(content: CoverLetterContent): string {
  const bodyParagraphs = content.body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px 0;">${escapeHtml(paragraph)}</p>`)
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 16px 0;">${escapeHtml(content.opening)}</p>
      ${bodyParagraphs}
      <p style="margin:0 0 16px 0;">${escapeHtml(content.closing)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 0 0;" />
      ${SIGNATURE_BLOCK}
    </div>
  </body>
</html>`;
}
