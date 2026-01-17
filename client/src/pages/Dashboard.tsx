import { useQuery } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ApiListResponse, Appointment, PaginatedResponse, PatientSummary, Treatment } from '../types/api';

export default function Dashboard() {
  const { data: appointments } = useQuery<Appointment[]>('today-appointments', async () => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const startDate = startOfDay.toISOString();
    const endDate = endOfDay.toISOString();
    const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
      params: { startDate, endDate, limit: 10 },
    });
    return response.data.data;
  });

  const { data: upcomingAppointments } = useQuery<Appointment[]>('upcoming-appointments', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfRange = new Date(tomorrow);
    startOfRange.setHours(0, 0, 0, 0);
    const endOfRange = new Date(tomorrow);
    endOfRange.setDate(endOfRange.getDate() + 2);
    endOfRange.setHours(23, 59, 59, 999);
    const startDate = startOfRange.toISOString();
    const endDate = endOfRange.toISOString();
    const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
      params: { startDate, endDate, limit: 10 },
    });
    return response.data.data;
  });

  const { data: pendingTreatments } = useQuery<PaginatedResponse<Treatment>>('pending-treatments', async () => {
    const response = await api.get<PaginatedResponse<Treatment>>('/treatments', {
      params: { status: 'pending', limit: 5 },
    });
    return response.data;
  });

  const { data: patients } = useQuery<PatientSummary[]>('recent-patients', async () => {
    const response = await api.get<ApiListResponse<PatientSummary>>('/patients', { params: { limit: 5 } });
    return response.data.data;
  });

  const appointmentsList = appointments ?? [];
  const upcomingAppointmentsList = upcomingAppointments ?? [];
  const pendingTreatmentsList = pendingTreatments?.data ?? [];
  const patientsList = patients ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Today's Appointments</h3>
          <p className="text-3xl font-bold text-primary-600">
            {appointmentsList.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Patients</h3>
          <p className="text-3xl font-bold text-primary-600">
            {patientsList.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Treatments</h3>
          <p className="text-3xl font-bold text-primary-600">
            {pendingTreatments?.pagination?.total ?? pendingTreatmentsList.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointments</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Today
              </h3>
              {appointmentsList.length > 0 ? (
                appointmentsList.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/appointments/${apt._id}/edit`}
                    className="block p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 mb-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {typeof apt.patient === 'string'
                            ? ''
                            : `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-600">{apt.type}</p>
                      </div>
                      <span className="text-sm font-medium text-primary-600">
                        {format(new Date(apt.appointmentDate), 'MM/dd/yyyy hh:mm a')}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-sm py-2">No appointments today</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Upcoming
              </h3>
              {upcomingAppointmentsList.length > 0 ? (
                upcomingAppointmentsList.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/appointments/${apt._id}/edit`}
                    className="block p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 mb-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {typeof apt.patient === 'string'
                            ? ''
                            : `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-600">{apt.type}</p>
                      </div>
                      <span className="text-sm font-medium text-primary-600">
                        {format(new Date(apt.appointmentDate), 'MM/dd/yyyy hh:mm a')}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-sm py-2">No upcoming appointments</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Treatments</h2>
            <div className="space-y-3">
              {pendingTreatmentsList.length > 0 ? (
                pendingTreatmentsList.map((treatment) => (
                  <Link
                    key={treatment._id}
                    to={`/treatments/${treatment._id}/edit`}
                    className="block p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100"
                  >
                    <p className="font-medium text-gray-800">
                      {typeof treatment.patient === 'string'
                        ? ''
                        : `${treatment.patient?.firstName || ''} ${treatment.patient?.lastName || ''}`.trim()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {treatment.procedure} • {format(new Date(treatment.treatmentDate), 'MM/dd/yyyy')}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No pending treatments</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Patients</h2>
            <div className="space-y-3">
              {patientsList.length > 0 ? (
                patientsList.map((patient) => (
                  <Link
                    key={patient._id}
                    to={`/patients/${patient._id}`}
                    className="block p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100"
                  >
                    <p className="font-medium text-gray-800">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{patient.patientNumber}</p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent patients</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
