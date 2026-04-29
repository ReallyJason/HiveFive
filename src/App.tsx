import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth';
import { FeaturesProvider } from './lib/features';
import { AccountStatusGate } from './components/AccountStatusGate';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <AuthProvider>
        <FeaturesProvider>
          <AccountStatusGate>
            <RouterProvider router={router} />
          </AccountStatusGate>
          <Toaster />
        </FeaturesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
