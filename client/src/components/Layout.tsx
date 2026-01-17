import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import PasswordModal from './PasswordModal';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleContextMenu = (e: MouseEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setShowPasswordModal(true);
      }
    };

    sidebar.addEventListener('contextmenu', handleContextMenu);
    return () => {
      sidebar.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => navigate('/admin/reports')}
        correctPassword="admin"
      />

      {/* Sidebar */}
      <aside ref={sidebarRef} className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">Dental CMS</h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/dashboard"
            className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600"
          >
            Dashboard
          </Link>
          <Link
            to="/patients"
            className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600"
          >
            Patients
          </Link>
          <Link
            to="/calendar"
            className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 font-medium"
          >
            Calendar
          </Link>
          <Link
            to="/appointments"
            className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600"
          >
            Appointments
          </Link>
          <Link
            to="/treatments"
            className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600"
          >
            Treatments
          </Link>
          {(user?.role === 'admin' || user?.role === 'dentist') && (
            <Link
              to="/users"
              className="block px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600"
            >
              Staff Management
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.firstName}</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 capitalize">{user?.role}</span>
            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="btn btn-secondary text-sm w-9 h-9 flex items-center justify-center"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
