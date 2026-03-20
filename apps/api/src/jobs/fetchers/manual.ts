export interface ManualJobInput {
  title?: string;
  company?: string;
  description: string;
  url?: string;
}

export function parseManualPaste(text: string): ManualJobInput {
  const normalizedText = text.trim();
  const lines = normalizedText.split("\n").map((l) => l.trim()).filter(Boolean);
  let title = "";
  let company = "";
  let description = normalizedText;
  let url = "";

  for (const line of lines) {
    if (line.startsWith("http")) {
      url = line;
    } else if (!title && line.length < 100) {
      title = line;
    } else if (!company && line.length < 80 && !line.includes("•") && !line.includes("-")) {
      company = line;
    }
  }

  if (lines.length >= 3) {
    title = lines[0] ?? "";
    company = lines[1] ?? "";
    description = lines.slice(2).join("\n");
  } else if (lines.length === 2) {
    title = lines[0] ?? "";
    description = lines[1] ?? normalizedText;
  }

  return {
    title: title || "Unknown Role",
    company: company || "Unknown Company",
    description: description.trim(),
    url: url || undefined,
  };
}
