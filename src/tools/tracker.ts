import ExcelJS from "exceljs";
import fs from "fs";

const FILE = "candidatures.xlsx";
const SHEET_NAME = "Candidatures";

export type CandidatureEntry = {
  date: string;
  company: string;
  position: string;
  status: string;
};

export async function saveCandidature(args: any): Promise<string> {
  const wb = new ExcelJS.Workbook();
  let ws: ExcelJS.Worksheet;

  if (fs.existsSync(FILE)) {
    await wb.xlsx.readFile(FILE);
    ws = wb.getWorksheet(SHEET_NAME) || wb.addWorksheet(SHEET_NAME);
  } else {
    ws = wb.addWorksheet(SHEET_NAME);
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

export async function getCandidatures(): Promise<CandidatureEntry[]> {
  if (!fs.existsSync(FILE)) {
    return [];
  }

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(FILE);
    const ws = wb.getWorksheet(SHEET_NAME);

    if (!ws || ws.rowCount < 2) {
      return [];
    }

    const rows: CandidatureEntry[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const date = row.getCell(1).text?.trim() || "";
      const company = row.getCell(2).text?.trim() || "";
      const position = row.getCell(3).text?.trim() || "";
      const status = row.getCell(5).text?.trim() || "";

      if (!date && !company && !position && !status) {
        return;
      }

      rows.push({ date, company, position, status });
    });

    return rows;
  } catch (err: any) {
    console.error("❌ Impossible de lire candidatures.xlsx:", err?.message || err);
    return [];
  }
}
