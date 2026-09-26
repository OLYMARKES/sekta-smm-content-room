import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./history.css";

export const metadata: Metadata = {
  title: "#Sekta Content Room — команда",
  description: "Общие материалы, согласование и конструктор постов #Sekta",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
