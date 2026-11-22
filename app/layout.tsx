import type { Metadata, Viewport } from 'next';
import { Bangers, Comic_Neue } from 'next/font/google';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './globals.css';
import Providers from './providers';

const bangers = Bangers({ weight: '400', subsets: ['latin'], variable: '--font-bangers' });
const comic = Comic_Neue({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-comic' });

export const metadata: Metadata = {
  title: 'Notice Period: a motion comic game',
  description: 'You quit with no offer. Land a job before your notice runs out, while the company dumps work on you and blames you for everything.',
};
// No pinch/double-tap zoom: on phones it fights with the games' taps and swipes.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#ffd23f' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bangers.variable} ${comic.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
