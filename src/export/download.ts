import { exportAllCardsAsCsv } from "./rows";

/** Default filename for the admin-tool export. */
export const DEFAULT_EXPORT_FILENAME = "price-charming-cards.csv";

/**
 * tsconfig keeps the lib list at ES2022-only so the engine stays
 * runtime-neutral. The DOM APIs we reach for here are resolved
 * through `globalThis` with structural casts, and we feature-detect
 * before touching them.
 */
interface BrowserDownloadApis {
  document: {
    body: { appendChild: (n: unknown) => void; removeChild: (n: unknown) => void };
    createElement: (tag: string) => {
      href: string;
      download: string;
      click: () => void;
    };
  };
  URL: {
    createObjectURL: (blob: unknown) => string;
    revokeObjectURL: (url: string) => void;
  };
  Blob: new (parts: unknown[], opts: { type: string }) => unknown;
}

function browserApis(): BrowserDownloadApis | null {
  const g = globalThis as Record<string, unknown>;
  const doc = g["document"];
  const URLCtor = g["URL"];
  const BlobCtor = g["Blob"];
  if (
    !doc ||
    !URLCtor ||
    !BlobCtor ||
    typeof (URLCtor as { createObjectURL?: unknown }).createObjectURL !==
      "function"
  ) {
    return null;
  }
  return {
    document: doc as BrowserDownloadApis["document"],
    URL: URLCtor as BrowserDownloadApis["URL"],
    Blob: BlobCtor as BrowserDownloadApis["Blob"],
  };
}

/**
 * Trigger a browser download of the full card export as a CSV file.
 * Returns the CSV string either way so non-browser callers (tests,
 * Node tooling) still get the payload — in Node it's a no-op beyond
 * serialization. The download includes a UTF-8 BOM so Excel renders
 * the emoji star ratings correctly.
 */
export function downloadCardsExport(
  filename: string = DEFAULT_EXPORT_FILENAME
): string {
  const csv = exportAllCardsAsCsv();
  const apis = browserApis();
  if (!apis) return csv;

  const blob = new apis.Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = apis.URL.createObjectURL(blob);
  const anchor = apis.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  apis.document.body.appendChild(anchor);
  anchor.click();
  apis.document.body.removeChild(anchor);
  apis.URL.revokeObjectURL(url);
  return csv;
}
