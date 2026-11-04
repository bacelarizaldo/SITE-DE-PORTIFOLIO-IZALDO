"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, weddingSite, whatsappHref } from "@/lib/site-config";

function ExternalArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
    </svg>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-ink/90 backdrop-blur-sm border-b border-line" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Izaldo Bacelar — página inicial">
          <Image
            src="/brand/lockup-horizontal-white.svg"
            alt="Izaldo Bacelar"
            width={168}
            height={19}
            className="h-4 md:h-[18px] w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm tracking-wide text-paper/80">
          {navLinks.map((link) =>
            link.plain ? (
              <a key={link.href} href={link.href} className="hover:text-paper transition-colors">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-paper transition-colors">
                {link.label}
              </Link>
            )
          )}
          <span className="h-4 w-px bg-paper/20" aria-hidden="true" />
          <a
            href={weddingSite.href}
            target="_blank"
            rel="noopener noreferrer"
            className="-ml-4 inline-flex items-center gap-1.5 text-accent hover:text-paper transition-colors"
          >
            {weddingSite.label}
            <ExternalArrow className="w-3 h-3" />
          </a>
        </nav>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center rounded-full border border-paper/30 px-5 py-2 text-sm text-paper hover:border-accent hover:text-accent transition-colors"
        >
          Vamos conversar
        </a>

        <button
          type="button"
          className="md:hidden text-paper"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-6 h-px bg-paper mb-1.5" />
          <span className="block w-6 h-px bg-paper mb-1.5" />
          <span className="block w-4 h-px bg-paper" />
        </button>
      </div>

      {open && (
        <nav className="md:hidden bg-ink border-t border-line px-6 py-8 flex flex-col gap-6 text-lg">
          {navLinks.map((link) =>
            link.plain ? (
              <a key={link.href} href={link.href} className="text-paper/90">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-paper/90">
                {link.label}
              </Link>
            )
          )}
          <div className="pt-6 border-t border-line flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-mist">Outro site</span>
            <a
              href={weddingSite.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 text-accent"
            >
              {weddingSite.label}
              <ExternalArrow className="w-3.5 h-3.5" />
            </a>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-fit items-center rounded-full border border-paper/30 px-5 py-2 text-sm text-paper"
          >
            Vamos conversar
          </a>
        </nav>
      )}
    </header>
  );
}
