import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600 mt-2">Page not found</p>
      <Link to="/dashboard" className="btn-primary inline-block mt-6">
        Go to Dashboard
      </Link>
    </div>
  </div>
);