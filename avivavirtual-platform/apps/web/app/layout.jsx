import './globals.css';

export const metadata = {
  title: 'Avivavirtual',
  description: 'Customer care operations dashboard'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
