"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
  id?: string;
};

/**
 * Wrapper de animação scroll-reveal (fade + translateY sutil).
 * Usa IntersectionObserver; respeita prefers-reduced-motion via CSS (globals.css).
 */
export default function SectionReveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  id,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const Comp = as;
  return (
    <Comp ref={ref as never} id={id} className={`reveal ${className}`}>
      {children}
    </Comp>
  );
}
