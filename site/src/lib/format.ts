export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1).replace(".", ",")} GB`;
}

export function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

/** Título definido no admin; sem ele, o nome do arquivo */
export function videoTitle(name: string, titles?: Record<string, string>) {
  return titles?.[name] || titleFromFileName(name);
}

export function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** "Bom dia", "Boa tarde" ou "Boa noite" no horário do estúdio */
export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Recife" }).format(new Date())
  );
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

/** Data e hora de um recado: 4 de nov. de 2026, 14:32 (horário do estúdio) */
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Recife",
  });
}

/** Data curta para tabelas: 14 mar. 2026 */
export function formatShortDate(date?: string) {
  if (!date) return "";
  const d = new Date(date.length === 10 ? `${date}T12:00:00` : date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

/** "2026-11" → "Novembro de 2026" */
export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 15).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
