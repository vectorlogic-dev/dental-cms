import { useQuery } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';

export default function Appointments() {
  const { data, isLoading } = useQuery('appointments', async () => {
    const response = await api.get('/appointments', { params: { limit: 50 } });
    return response.data.data;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
        <button className="btn btn-primary">Schedule Appointment</button>
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Dentist</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((apt: any) => (
                  <tr key={apt._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(apt.appointmentDate), 'MMM dd, yyyy hh:mm a')}
                    </td>
                    <td className="py-3 px-4">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </td>
                    <td className="py-3 px-4">
                      {apt.dentist?.firstName} {apt.dentist?.lastName}
                    </td>
                    <td className="py-3 px-4 capitalize">{apt.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
