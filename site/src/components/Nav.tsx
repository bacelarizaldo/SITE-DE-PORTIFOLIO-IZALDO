"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, whatsappHref } from "@/lib/site-config";

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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-paper transition-colors">
              {link.label}
            </Link>
          ))}
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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-paper/90">
              {link.label}
            </Link>
          ))}
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
