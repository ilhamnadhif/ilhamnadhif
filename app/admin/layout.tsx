import type { Metadata } from "next";
import { franklin } from "@/lib/fonts";
import { themeScript } from "@/lib/theme-script";
import "../globals.css";
import "./admin.css";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="id" className={franklin.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="admin">{children}</body>
    </html>
  );
}
