import type { Metadata } from "next";
import { Urbanist } from "next/font/google";

export const metadata: Metadata = {
  title: { absolute: "Entregas · Admin | IB Films" },
  robots: { index: false, follow: false },
};

// Fonte só do painel; o site público segue com a dele
const adminSans = Urbanist({
  variable: "--font-admin-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      // O site da IB Films é escuro; o painel é claro, então os campos de formulário seguem o tema claro
      style={{ colorScheme: "light" }}
      className={`${adminSans.variable} min-h-screen w-full bg-adm-bg font-admin text-adm-ink antialiased`}
    >{children}</div>
  );
}
