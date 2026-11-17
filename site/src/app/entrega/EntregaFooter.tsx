import Image from "next/image";
import Link from "next/link";
import { siteConfig, whatsappHref } from "@/lib/site-config";

// Rodapé das páginas de entrega: marca, contato e privacidade, sem o menu do site
export default function EntregaFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="border-t border-line px-6 py-12 text-center">
      {children && <p className="mx-auto mb-6 max-w-xl text-sm leading-6 text-mist">{children}</p>}
      <Link href="/" aria-label={`${siteConfig.brand} — página inicial`} className="inline-block">
        <Image src="/brand/lockup-horizontal-white.svg" alt={siteConfig.brand} width={140} height={28} className="h-7 w-auto opacity-90" />
      </Link>
      <nav aria-label="Links" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-paper/75">
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-paper">
          WhatsApp
        </a>
        <Link href="/privacidade" className="hover:text-paper">
          Política de Privacidade
        </Link>
        <Link href="/" className="hover:text-paper">
          izaldobacelar.com
        </Link>
      </nav>
      <p className="mt-4 text-xs text-mist/70">{siteConfig.location}</p>
    </footer>
  );
}
