import Image from "next/image";
import Link from "next/link";
import { greeting } from "@/lib/format";

// Quadrados acesos no mosaico (linha, coluna): lembram os quadros de uma timeline.
// "dim" fica num tom mais apagado do laranja.
const LIT = new Map<string, "on" | "dim">([
  ["0-3", "on"],
  ["0-6", "dim"],
  ["1-2", "on"],
  ["1-6", "on"],
  ["2-5", "on"],
  ["3-3", "on"],
  ["3-7", "dim"],
  ["4-1", "on"],
  ["4-4", "on"],
]);

function Mosaic() {
  return (
    <div aria-hidden="true" className="grid w-full max-w-[486px] grid-cols-8 gap-2.5">
      {Array.from({ length: 40 }, (_, i) => {
        const key = `${Math.floor(i / 8)}-${i % 8}`;
        const lit = LIT.get(key);
        return (
          <span
            key={key}
            style={lit === "on" ? { animationDelay: `${(i % 7) * 0.45}s` } : undefined}
            className={`aspect-square rounded-[10px] ${
              lit === "on"
                ? "animate-[pulse_3.2s_ease-in-out_infinite] bg-accent motion-reduce:animate-none"
                : lit === "dim"
                  ? "bg-[#8a5532]"
                  : "bg-[#132a37]"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Tela de entrada do painel. É um sistema só da IB Films: não tem cadastro nem login social,
 * só a senha do admin. O painel escuro (marca) some no celular, onde fica só o formulário.
 */
export default function LoginScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <Link href="/" aria-label="IB Films — voltar para o site" className="w-fit">
          <Image src="/brand/lockup-horizontal-white.svg" alt="IB Films" width={150} height={30} className="h-7 w-auto" priority />
        </Link>

        <Mosaic />

        <div>
          <p className="font-sans text-[52px] font-black leading-[1] tracking-[-0.03em] text-balance">
            {greeting()}, Izaldo.
          </p>
          <p className="mt-4 max-w-sm font-sans text-base leading-7 text-mist">
            Vídeos, fotos e recados de cada cliente, num lugar só.
          </p>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col bg-adm-bg px-6 py-8 text-adm-ink lg:px-12">
        {/* No celular, a marca vem para o topo */}
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="IB Films — voltar para o site">
            <Image src="/brand/lockup-horizontal-black.svg" alt="IB Films" width={130} height={26} className="h-6 w-auto" />
          </Link>
          <Link href="/" className="shrink-0 text-sm font-medium whitespace-nowrap text-adm-muted transition hover:text-adm-ink">
            ← <span className="lg:hidden">Site</span>
            <span className="hidden lg:inline">Voltar para o site</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <p className="text-center text-xs text-adm-muted lg:text-right">Painel interno · IB Films</p>
      </section>
    </main>
  );
}
