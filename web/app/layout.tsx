import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/providers';
import { WalletButton } from '@/components/WalletButton';
import { EXPLORER_CONTRACT } from '@/lib/config';

export const metadata: Metadata = {
  title: 'QuestBoard — on-chain bounties on Stellar',
  description:
    'Post tasks, earn rewards, build reputation — trustlessly on Soroban. Rewards locked in escrow, released on approval.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="border-b border-white/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                <span className="text-accent">◈</span> QuestBoard
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-white/70 hover:text-white">
                  Browse
                </Link>
                <Link href="/post" className="text-white/70 hover:text-white">
                  Post a quest
                </Link>
                <WalletButton />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
          <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-white/40">
            Running on Stellar testnet ·{' '}
            <a href={EXPLORER_CONTRACT} className="underline hover:text-white/70" target="_blank">
              View contract
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
