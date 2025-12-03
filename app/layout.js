import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistem Pakar Pemilihan Kos - Metode TOPSIS',
  description: 'Aplikasi sistem pakar untuk memilih kos terbaik menggunakan metode TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
