import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "All AI — One Console for Every Model",
  description:
    "Chat with, route between, and compare every AI model connected through your OmniRoute gateway.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
