import { Outlet } from 'react-router';
import { useAuth } from '../lib/auth';
import { NavBar } from './NavBar';
import { Link } from 'react-router';

/**
 * Layout wrapper for protected routes.
 * When the user is NOT authenticated, renders a 404 page with the logged-out
 * NavBar so that no internal content or logged-in UI is ever visible.
 * While auth state is loading, renders nothing to avoid a flash of 404.
 */
export function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth();

  // Wait for auth check to complete before deciding
  if (loading) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-out" />
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="text-center">
            <div className="font-display italic text-8xl text-charcoal-200">404</div>
            <h1 className="font-sans font-bold text-xl text-charcoal-900 mt-4">
              Page not found
            </h1>
            <p className="text-sm text-charcoal-500 mt-2 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-3 justify-center mt-8">
              <Link
                to="/"
                className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 inline-flex items-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
