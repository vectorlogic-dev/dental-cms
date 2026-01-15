import { useQuery } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: appointments } = useQuery('today-appointments', async () => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const startDate = format(startOfDay, 'yyyy-MM-dd');
    const endDate = format(endOfDay, 'yyyy-MM-dd');
    const response = await api.get('/appointments', {
      params: { startDate, endDate, limit: 10 },
    });
    return response.data.data;
  });

  const { data: patients } = useQuery('recent-patients', async () => {
    const response = await api.get('/patients', { params: { limit: 5 } });
    return response.data.data;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Today's Appointments</h3>
          <p className="text-3xl font-bold text-primary-600">
            {appointments?.length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Patients</h3>
          <p className="text-3xl font-bold text-primary-600">
            {patients?.length || 0}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Treatments</h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Appointments</h2>
          <div className="space-y-3">
            {appointments?.length > 0 ? (
              appointments.map((apt: any) => (
                <div
                  key={apt._id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{apt.type}</p>
                    </div>
                    <span className="text-sm font-medium text-primary-600">
                      {format(new Date(apt.appointmentDate), 'hh:mm a')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Patients</h2>
          <div className="space-y-3">
            {patients?.length > 0 ? (
              patients.map((patient: any) => (
                <div
                  key={patient._id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="font-medium text-gray-800">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{patient.patientNumber}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent patients</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
