import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
/* UI depth / polish — remove this import + delete ui-polish.css to revert */
import "./ui-polish.css";
import { DatabaseOrchestratorProvider } from "@/orchestrator";
import AiChatBubble from "@/components/AiChatBubble";
import { I18nProvider } from "@/i18n/I18nProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Company Car Sharing",
  description: "Company car sharing – login, reserve cars, manage fleet",
};

export const viewport = { width: "device-width", initialScale: 1, maximumScale: 5 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased font-sans`}>
        <I18nProvider>
          <DatabaseOrchestratorProvider>
            {children}
            <AiChatBubble />
          </DatabaseOrchestratorProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
