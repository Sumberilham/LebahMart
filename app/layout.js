import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'LebahMart — Marketplace lokal, bayar gampang',
  description: 'Demo marketplace bergaya Tokopedia dengan mock payment gateway: QRIS, Virtual Account, e-wallet, dan COD.',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <a href="#main" style={{ position: 'absolute', left: -9999 }}>Lewati ke konten</a>
        <Header />
        <main id="main" style={{ minHeight: '60vh' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
