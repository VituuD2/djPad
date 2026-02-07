import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DJ Pad Controller',
  description: 'Pro-grade web DJ pad simulation with low latency audio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}