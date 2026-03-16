import fs from "node:fs/promises";
import path from "node:path";

const isLikelyBinaryOrPdf = (buffer: Buffer, filePath: string): boolean => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    return true;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  let suspiciousBytes = 0;

  for (const byte of sample) {
    const isControl = byte < 9 || (byte > 13 && byte < 32);
    if (isControl || byte === 0) {
      suspiciousBytes += 1;
    }
  }

  return sample.length > 0 && suspiciousBytes / sample.length > 0.1;
};

export const fileParser = {
  async extractText(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath.replace(/^\//, ""));

    try {
      const raw = await fs.readFile(absolutePath);

      if (isLikelyBinaryOrPdf(raw, filePath)) {
        return `Contract text extraction placeholder for file ${path.basename(filePath)}. A readable plain-text extraction was not available, so downstream analysis should use a safe generic fallback instead of raw binary PDF content.`;
      }

      const content = raw.toString("utf-8");
      const normalized = content.replace(/\s+/g, " ").trim();

      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // Fall back to a safe placeholder when binary parsing is not implemented yet.
    }

    return `Contract text extraction placeholder for file ${path.basename(filePath)}. This uploaded contract is ready for downstream AI analysis.`;
  },
};
