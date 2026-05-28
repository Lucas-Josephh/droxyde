import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.scss';

export const metadata: Metadata = {
  title: 'Droxyde',
  description: 'Droxyde — fullstack starter',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
