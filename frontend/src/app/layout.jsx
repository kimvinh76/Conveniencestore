import "./globals.css";
import Script from "next/script";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata = {
  title: "DDBMS Web",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
        </ToastProvider>
      </body>
    </html>
  );
}
