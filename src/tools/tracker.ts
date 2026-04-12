import ExcelJS from "exceljs";
import fs from "fs";

const FILE = "candidatures.xlsx";

export async function saveCandidature(args: any): Promise<string> {
  const wb = new ExcelJS.Workbook();
  let ws: ExcelJS.Worksheet;

  if (fs.existsSync(FILE)) {
    await wb.xlsx.readFile(FILE);
    ws = wb.getWorksheet("Candidatures") || wb.addWorksheet("Candidatures");
  } else {
    ws = wb.addWorksheet("Candidatures");
    ws.addRow(["Date", "Entreprise", "Poste", "Email", "Statut"]);
    ws.getRow(1).font = { bold: true };
    ws.columns = [
      { key: "date",    width: 18 },
      { key: "company", width: 25 },
      { key: "title",   width: 30 },
      { key: "email",   width: 30 },
      { key: "status",  width: 15 }
    ];
  }

  ws.addRow([
    new Date().toLocaleString("fr-FR"),
    args.company,
    args.job_title,
    args.to_email,
    "Envoyée"
  ]);

  await wb.xlsx.writeFile(FILE);
  return `✅ Candidature sauvegardée dans ${FILE}`;
}