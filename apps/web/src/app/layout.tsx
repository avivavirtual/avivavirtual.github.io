import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AvivaVirtual | AI Customer Care Outsourcing',
  description: 'White-labelled AI and human customer care outsourcing for Canadian enterprises.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
