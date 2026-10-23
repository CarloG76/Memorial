import type { Metadata } from "next";
import "./globals.css";
import "./console-navigation-font.css";

export const metadata: Metadata = {
  title: { default: "Memorial — I ricordi continuano a vivere", template: "%s | Memorial" },
  description: "Uno spazio digitale per custodire storie, ricordi e pensieri di chi amiamo.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <a href="#contenuto" className="skip-link">Vai al contenuto</a>
        {children}
      </body>
    </html>
  );
}
