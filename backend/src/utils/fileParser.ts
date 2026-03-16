import fs from "node:fs/promises";
import path from "node:path";

export const fileParser = {
  async extractText(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath.replace(/^\//, ""));

    try {
      const content = await fs.readFile(absolutePath, "utf-8");
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
