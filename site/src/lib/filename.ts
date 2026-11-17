// Usado no navegador e no servidor: o admin precisa saber, antes de enviar,
// com que nome o arquivo vai ficar no R2 (para avisar sobre repetidos).
export function sanitizeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const clean = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return (clean || "arquivo") + (ext ? `.${ext.replace(/[^a-z0-9]/g, "")}` : "");
}
