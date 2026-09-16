/** Base path per GitHub Pages (es. /LetturaContatori). Vuoto in sviluppo locale. */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  .replace(/\/$/, "");

export function withBase(path: string): string {
  if (!basePath) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
