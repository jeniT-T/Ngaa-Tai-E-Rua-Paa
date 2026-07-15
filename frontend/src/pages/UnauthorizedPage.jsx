import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
      <p className="text-gray-600 mb-6">
        You don't have permission to view this page.
      </p>
      <Link to="/" className="underline">
        Back to home
      </Link>
    </div>
  );
}