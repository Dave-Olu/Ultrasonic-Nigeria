import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solar Installation in Nigeria | Ultrasonic Power Line Venture',
  description:
    'Ultrasonic Power Line Venture provides solar panel installation, batteries, inverters, repairs, maintenance, and renewable energy solutions across Nigeria.',
  metadataBase: new URL('https://example.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
