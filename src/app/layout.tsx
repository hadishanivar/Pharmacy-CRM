import type { Metadata } from "next";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM داروخانه مهر",
  description: "سامانه مدیریت ارتباط با مشتریان، نسخه‌ها و انبار داروخانه",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;800&display=swap"
        />
      </head>
      <body className="text-slate-800 antialiased">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
