import fs from "node:fs/promises";
import path from "node:path";

const escapePdfText = (input: string): string =>
  input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildPdfLines = (lines: string[]): string => {
  const fontSize = 12;
  const leading = 18;
  const startY = 760;

  return lines
    .map((line, index) => `BT /F1 ${fontSize} Tf 50 ${startY - index * leading} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");
};

export const createReportPdf = async (payload: {
  reportId: string;
  contractName: string;
  summary: string;
  recommendations: string[];
  riskScore: number;
  trustSealStatus: string;
}): Promise<string> => {
  const reportsDir = path.resolve(process.cwd(), "uploads", "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const lines = [
    "ContractSense Final Trust Seal Report",
    "",
    `Report ID: ${payload.reportId}`,
    `Contract: ${payload.contractName}`,
    `Risk Score: ${payload.riskScore}/100`,
    `Trust Seal: ${payload.trustSealStatus}`,
    "",
    "Executive Summary",
    payload.summary || "No summary available.",
    "",
    "Recommendations",
    ...(payload.recommendations.length ? payload.recommendations.map((item, index) => `${index + 1}. ${item}`) : ["1. No recommendations available."]),
  ];

  const stream = buildPdfLines(lines);
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${318 + stream.length + 40}
%%EOF`;

  const fileName = `report-${payload.reportId}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  await fs.writeFile(filePath, content, "binary");

  return `/uploads/reports/${fileName}`;
};
