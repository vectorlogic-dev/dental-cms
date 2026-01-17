import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import PatientForm from './pages/PatientForm';
import Appointments from './pages/Appointments';
import AppointmentForm from './pages/AppointmentForm';
import Treatments from './pages/Treatments';
import TreatmentForm from './pages/TreatmentForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Calendar from './pages/Calendar';
import AdminReports from './pages/AdminReports';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<AppointmentForm />} />
        <Route path="appointments/:id/edit" element={<AppointmentForm />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="treatments" element={<Treatments />} />
        <Route path="treatments/new" element={<TreatmentForm />} />
        <Route path="treatments/:id/edit" element={<TreatmentForm />} />
        <Route path="users" element={<Users />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id/edit" element={<UserForm />} />
        <Route path="admin/reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
