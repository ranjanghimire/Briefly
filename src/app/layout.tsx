import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Briefly Backend",
  description: "Serverless backend for Briefly mobile news app"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

