import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Entrega | IB Films" },
  robots: { index: false, follow: false },
};

export default function EntregaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full bg-ink text-paper">{children}</div>;
}
