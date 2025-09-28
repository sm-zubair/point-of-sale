import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from '../components/auth-context';
import Notification from '../components/notification';
import '../global.css';

export const metadata = {
  title: 'Ice & Snack Village',
  description: "Freddy's food street",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <base href="/" />
      </head>
      <body>
        <PrimeReactProvider>
          <AuthProvider>
            <main className="m-auto">{children}</main>
          </AuthProvider>
          <Notification />
        </PrimeReactProvider>
      </body>
    </html>
  );
}
