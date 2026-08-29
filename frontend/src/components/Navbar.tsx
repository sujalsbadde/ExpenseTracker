import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-600 font-bold text-xl tracking-tight">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-gray-900 font-extrabold text-lg">ExpenseTracker</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
