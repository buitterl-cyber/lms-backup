"use client";

/** Downloads the given rows as a CSV file, entirely client-side. */
export function ExportCsv({ filename, header, rows, label = "Export CSV" }: {
  filename: string;
  header: string[];
  rows: (string | number | null)[][];
  label?: string;
}) {
  function download() {
    const esc = (v: string | number | null) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button onClick={download} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-card">
      {label}
    </button>
  );
}
