import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
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
