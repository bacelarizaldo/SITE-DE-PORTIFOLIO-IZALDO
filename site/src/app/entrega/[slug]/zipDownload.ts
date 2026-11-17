// Liga a página ao service worker /zip-sw.js, que monta o .zip em fluxo.
export type ZipFile = { url: string; name: string; size: number };

export type ZipEvents = {
  onProgress: (done: number, total: number) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

export function canZip() {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof ReadableStream !== "undefined";
}

/** Registra o worker cedo, para o primeiro clique em "Baixar" não esperar a instalação. */
export function prepareZip() {
  if (canZip()) navigator.serviceWorker.register("/zip-sw.js", { scope: "/entrega/" }).catch(() => {});
}

export const UNSUPPORTED =
  "Este navegador não permite baixar tudo de uma vez. Abram o link no Chrome ou no Safari (fora do WhatsApp e do Instagram) ou baixem as fotos uma a uma.";

async function activeWorker() {
  // Navegadores embutidos em apps (WhatsApp, Instagram) às vezes bloqueiam o service worker
  const registration = await navigator.serviceWorker
    .register("/zip-sw.js", { scope: "/entrega/" })
    .catch(() => {
      throw new Error(UNSUPPORTED);
    });
  if (registration.active) return registration.active;
  const ready = await navigator.serviceWorker.ready;
  return ready.active!;
}

export async function startZip(files: ZipFile[], filename: string, events: ZipEvents) {
  const worker = await activeWorker();
  const id = crypto.randomUUID().replace(/-/g, "");
  const channel = new MessageChannel();

  // Mensagens periódicas mantêm o worker ativo enquanto o download corre
  const keepAlive = setInterval(() => worker.postMessage({ type: "ping" }), 10_000);
  let frame: HTMLIFrameElement | null = null;
  const finish = () => {
    clearInterval(keepAlive);
    channel.port1.close();
    setTimeout(() => frame?.remove(), 30_000);
  };

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("O navegador não respondeu. Recarregue a página.")), 10_000);
    channel.port1.onmessage = (event) => {
      const data = event.data;
      if (data.type === "ready") {
        clearTimeout(timeout);
        resolve();
      } else if (data.type === "progress") {
        events.onProgress(data.done, data.total);
      } else if (data.type === "done") {
        finish();
        events.onDone();
      } else if (data.type === "error" || data.type === "cancelled") {
        finish();
        events.onError(data.type === "cancelled" ? "Download cancelado." : data.message);
      }
    };
    worker.postMessage({ type: "zip", id, filename, files }, [channel.port2]);
  });

  // O worker responde a este endereço com o .zip; o iframe faz o navegador baixar sem sair da página
  frame = document.createElement("iframe");
  frame.hidden = true;
  frame.src = `/entrega/__zip/${id}`;
  document.body.appendChild(frame);
}
