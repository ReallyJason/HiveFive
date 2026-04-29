import { Link } from 'react-router';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';

export default function NotFound() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant={isLoggedIn ? 'logged-in' : 'logged-out'} />
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
              to={isLoggedIn ? '/discover' : '/'}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 inline-flex items-center"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
