// Service worker que monta o "Baixar tudo" da área do cliente.
// A página manda a lista de fotos (URLs assinadas do R2); este worker busca uma a uma
// e entrega ao navegador um único .zip, gerado em fluxo: nada fica inteiro na memória,
// e o navegador mostra o download normal, com tamanho total e tempo restante.
// Formato: ZIP sem compressão (fotos e vídeos já são comprimidos), sempre em ZIP64
// para aceitar arquivos e pacotes acima de 4 GB.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(crc, bytes) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();
const LOCAL = 30 + 20; // cabeçalho local + extra ZIP64
const DESCRIPTOR = 24;
const CENTRAL = 46 + 28; // cabeçalho central + extra ZIP64
const END = 56 + 20 + 22; // fim ZIP64 + localizador + fim clássico

function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

/** Tamanho exato do .zip, para o navegador mostrar progresso e tempo restante. */
function zipSize(files) {
  let total = END;
  for (const f of files) {
    const name = encoder.encode(f.name).length;
    total += LOCAL + name + f.size + DESCRIPTOR + CENTRAL + name;
  }
  return total;
}

async function fetchWithRetry(url, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

/**
 * Gera os bytes do .zip. files: [{ url, name, size }].
 * onProgress(feitos, total) é chamado a cada arquivo concluído.
 */
async function* zipChunks(files, onProgress) {
  const { time, day } = dosDateTime(new Date());
  const entries = [];
  let offset = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = encoder.encode(file.name);

    const header = new DataView(new ArrayBuffer(LOCAL + name.length));
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 45, true); // versão 4.5 (ZIP64)
    header.setUint16(6, 0x0808, true); // descritor depois dos dados + nome em UTF-8
    header.setUint16(8, 0, true); // sem compressão
    header.setUint16(10, time, true);
    header.setUint16(12, day, true);
    header.setUint32(14, 0, true); // CRC vai no descritor
    header.setUint32(18, 0xffffffff, true);
    header.setUint32(22, 0xffffffff, true);
    header.setUint16(26, name.length, true);
    header.setUint16(28, 20, true);
    new Uint8Array(header.buffer).set(name, 30);
    header.setUint16(30 + name.length, 0x0001, true); // extra ZIP64
    header.setUint16(32 + name.length, 16, true);
    // tamanhos zerados aqui; os reais vão no descritor
    yield new Uint8Array(header.buffer);

    const start = offset;
    offset += header.byteLength;

    let crc = 0;
    let size = 0;
    const res = await fetchWithRetry(file.url);
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      crc = crc32(crc, value);
      size += value.length;
      yield value;
    }
    if (size !== file.size) throw new Error(`Tamanho inesperado em ${file.name}`);
    offset += size;

    const descriptor = new DataView(new ArrayBuffer(DESCRIPTOR));
    descriptor.setUint32(0, 0x08074b50, true);
    descriptor.setUint32(4, crc, true);
    descriptor.setBigUint64(8, BigInt(size), true);
    descriptor.setBigUint64(16, BigInt(size), true);
    yield new Uint8Array(descriptor.buffer);
    offset += DESCRIPTOR;

    entries.push({ name, crc, size, start });
    onProgress(i + 1, files.length);
  }

  const centralStart = offset;
  for (const e of entries) {
    const central = new DataView(new ArrayBuffer(CENTRAL + e.name.length));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 45, true);
    central.setUint16(6, 45, true);
    central.setUint16(8, 0x0808, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, day, true);
    central.setUint32(16, e.crc, true);
    central.setUint32(20, 0xffffffff, true);
    central.setUint32(24, 0xffffffff, true);
    central.setUint16(28, e.name.length, true);
    central.setUint16(30, 28, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, 0xffffffff, true);
    new Uint8Array(central.buffer).set(e.name, 46);
    const x = 46 + e.name.length;
    central.setUint16(x, 0x0001, true);
    central.setUint16(x + 2, 24, true);
    central.setBigUint64(x + 4, BigInt(e.size), true);
    central.setBigUint64(x + 12, BigInt(e.size), true);
    central.setBigUint64(x + 20, BigInt(e.start), true);
    yield new Uint8Array(central.buffer);
    offset += central.byteLength;
  }
  const centralSize = offset - centralStart;

  const end = new DataView(new ArrayBuffer(END));
  // fim do diretório ZIP64
  end.setUint32(0, 0x06064b50, true);
  end.setBigUint64(4, 44n, true);
  end.setUint16(12, 45, true);
  end.setUint16(14, 45, true);
  end.setUint32(16, 0, true);
  end.setUint32(20, 0, true);
  end.setBigUint64(24, BigInt(entries.length), true);
  end.setBigUint64(32, BigInt(entries.length), true);
  end.setBigUint64(40, BigInt(centralSize), true);
  end.setBigUint64(48, BigInt(centralStart), true);
  // localizador ZIP64
  end.setUint32(56, 0x07064b50, true);
  end.setUint32(60, 0, true);
  end.setBigUint64(64, BigInt(offset), true);
  end.setUint32(72, 1, true);
  // fim clássico, apontando para o ZIP64
  end.setUint32(76, 0x06054b50, true);
  end.setUint16(80, 0, true);
  end.setUint16(82, 0, true);
  end.setUint16(84, 0xffff, true);
  end.setUint16(86, 0xffff, true);
  end.setUint32(88, 0xffffffff, true);
  end.setUint32(92, 0xffffffff, true);
  end.setUint16(96, 0, true);
  yield new Uint8Array(end.buffer);
}

function zipResponse(job) {
  const chunks = zipChunks(job.files, (done, total) => job.port?.postMessage({ type: "progress", done, total }));
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await chunks.next();
        if (done) {
          controller.close();
          job.port?.postMessage({ type: "done" });
        } else {
          controller.enqueue(value);
        }
      } catch (err) {
        job.port?.postMessage({ type: "error", message: String(err && err.message ? err.message : err) });
        controller.error(err);
      }
    },
    cancel() {
      job.port?.postMessage({ type: "cancelled" });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zipSize(job.files)),
      "Content-Disposition": `attachment; filename="${job.filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

// Disponível para testes fora do navegador
self.__zip = { zipChunks, zipSize, crc32 };

const jobs = new Map();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "zip") {
    const port = event.ports[0];
    jobs.set(data.id, { files: data.files, filename: data.filename, port });
    port?.postMessage({ type: "ready" });
  }
  // "ping": a página manda de tempos em tempos para manter o worker ativo durante o download
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const match = url.pathname.match(/^\/entrega\/__zip\/([\w-]+)$/);
  if (!match) return;
  const job = jobs.get(match[1]);
  if (!job) return;
  jobs.delete(match[1]);
  event.respondWith(zipResponse(job));
});
