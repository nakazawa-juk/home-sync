import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HomeSync - 住宅建設工程管理',
  description:
    '注文住宅業界向け工程表管理システム - 工程表の更新忘れゼロ、取引先との認識ズレ解消',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
