
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const viewport = {
    themeColor: '#D4A853',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata = {
    title: 'DSM Agendamento - Barbearia Premium',
    description: 'Agende seu corte com os melhores profissionais.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'DSM Agendamento',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
