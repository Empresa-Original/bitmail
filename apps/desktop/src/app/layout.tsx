import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { ColorThemeProvider } from '../components/color-theme';
import { ToastProviderState } from '../components/ui/use-toast';
import { Toaster } from '../components/ui/toaster';

export const metadata = { title: 'BitMail Desktop' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ColorThemeProvider>
            <ToastProviderState>
              {children}
              <Toaster />
            </ToastProviderState>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
