import './globals.css';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ToastProvider } from '@/lib/hooks/useToast';

export const metadata = {
  title: 'Route 53 Console - AWS',
  description: 'AWS Route 53 managed DNS experience clone',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
