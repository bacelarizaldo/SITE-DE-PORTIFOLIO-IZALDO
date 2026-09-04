import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig, whatsappHref } from "@/lib/site-config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-16 md:py-20 grid gap-12 md:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col gap-4">
          <Image
            src="/brand/symbol-white.svg"
            alt=""
            width={32}
            height={24}
            className="h-6 w-auto opacity-90"
          />
          <p className="text-sm text-mist max-w-xs">
            Izaldo Bacelar — IB Films.
            <br />
            Produção audiovisual para marcas, empresas, eventos e casamentos.
          </p>
          <p className="text-xs text-mist/70">{siteConfig.location}</p>
        </div>

        <nav className="flex flex-wrap gap-x-10 gap-y-4 text-sm text-paper/80 md:justify-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-paper transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 text-sm text-paper/80 md:items-end">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            WhatsApp
          </a>
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            Instagram
          </a>
          <a href={`mailto:${siteConfig.email}`} className="hover:text-accent transition-colors">
            {siteConfig.email}
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-6 text-xs text-mist/60">
          <p>© {year} Izaldo Bacelar — IB Films. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
