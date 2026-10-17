import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DJ Pad Studio — Seu playground de sons',
  description: 'Crie sua mesa de sons online. Toque 25 pads, importe seus áudios e personalize loops, velocidade e graves. Grátis e sem cadastro.',
  applicationName: 'DJ Pad Studio',
  openGraph: {
    title: 'DJ Pad Studio — Seu playground de sons',
    description: 'Combine samples, importe sons e crie seu próprio set direto no navegador.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-body antialiased bg-background text-foreground min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
