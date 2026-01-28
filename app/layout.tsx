import "./globals.css";

export const metadata = {
  title: "Perp Board (OKX) – Next.js",
  description: "OKX SWAP perp board with WS tickers + throttled RSI calculation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
