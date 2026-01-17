import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import DentalChart from '../components/DentalChart';
import axios from 'axios';
import { ApiItemResponse, ApiListResponse, DentalChartEntry, PatientSummary, UserSummary, Appointment, Treatment } from '../types/api';
import { formatPersonName } from '../utils/formatting';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: patient, isLoading } = useQuery<PatientSummary>(
    ['patient', id],
    async () => {
      const response = await api.get<ApiItemResponse<PatientSummary>>(`/patients/${id}`);
      return response.data.data;
    },
    { enabled: !!id }
  );

  const { data: dentists } = useQuery<UserSummary[]>(
    'dentists',
    async () => {
      const response = await api.get<ApiListResponse<UserSummary>>('/users', { params: { role: 'dentist' } });
      return response.data.data;
    }
  );

  // Fetch patient appointments and treatments for timeline
  const { data: appointments } = useQuery<Appointment[]>(
    ['patient-appointments', id],
    async () => {
      const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
        params: { patientId: id, limit: 100 },
      });
      return response.data.data;
    },
    { enabled: !!id }
  );

  const { data: treatments } = useQuery<Treatment[]>(
    ['patient-treatments', id],
    async () => {
      const response = await api.get<ApiListResponse<Treatment>>('/treatments', {
        params: { patientId: id, limit: 100 },
      });
      return response.data.data;
    },
    { enabled: !!id }
  );

  // Combine and sort timeline items
  const timelineItems = useMemo(() => {
    const items: Array<{
      type: 'appointment' | 'treatment';
      id: string;
      date: Date;
      title: string;
      description?: string;
      status?: string;
      data: Appointment | Treatment;
    }> = [];

    appointments?.forEach((apt) => {
      items.push({
        type: 'appointment',
        id: apt._id,
        date: new Date(apt.appointmentDate),
        title: `${apt.type} - ${formatPersonName(apt.dentist)}`,
        description: apt.notes,
        status: apt.status,
        data: apt,
      });
    });

    treatments?.forEach((treatment) => {
      items.push({
        type: 'treatment',
        id: treatment._id,
        date: new Date(treatment.treatmentDate),
        title: `${treatment.procedure} - ${formatPersonName(treatment.dentist)}`,
        description: treatment.description || treatment.diagnosis,
        status: treatment.status,
        data: treatment,
      });
    });

    // Sort by date descending (most recent first)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, treatments]);

  const saveChartMutation = useMutation(
    async (chartData: DentalChartEntry[]) => {
      await api.put(`/patients/${id}`, { dentalChart: chartData });
    },
    {
      onSuccess: () => {
        toast.success('Dental chart updated');
        queryClient.invalidateQueries(['patient', id]);
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update dental chart';
        toast.error(message);
      },
    }
  );

  const deleteMutation = useMutation(
    async () => {
      await api.delete(`/patients/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Patient deactivated successfully');
        queryClient.invalidateQueries('patients');
        navigate('/patients');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to deactivate patient';
        toast.error(message);
      },
    }
  );

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center py-8">Patient not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {patient.firstName} {patient.lastName}
        </h1>
        <div className="flex gap-2">
          <Link to={`/patients/${id}/edit`} className="btn btn-primary">
            Edit
          </Link>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger">
            Deactivate
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Deactivate Patient</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to deactivate this patient? This will remove them from the active list.</p>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="btn btn-secondary"
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="btn btn-danger"
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Patient Number</dt>
              <dd className="mt-1 text-gray-900">{patient.patientNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Date of Birth</dt>
              <dd className="mt-1 text-gray-900">
                {patient.dateOfBirth
                  ? format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Gender</dt>
              <dd className="mt-1 text-gray-900 capitalize">{patient.gender}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Phone</dt>
              <dd className="mt-1 text-gray-900">{patient.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Email</dt>
              <dd className="mt-1 text-gray-900">{patient.email || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Information</h2>
          <dl className="space-y-3">
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Allergies</dt>
                <dd className="mt-1 text-gray-900">{patient.allergies.join(', ')}</dd>
              </div>
            )}
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Medical History</dt>
                <dd className="mt-1 text-gray-900">{patient.medicalHistory.join(', ')}</dd>
              </div>
            )}
            {patient.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Notes</dt>
                <dd className="mt-1 text-gray-900">{patient.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {patient.address && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Address</h2>
            <p className="text-gray-900">
              {patient.address.street}
              <br />
              {patient.address.city}, {patient.address.state} {patient.address.zipCode}
              <br />
              {patient.address.country}
            </p>
          </div>
        )}

        {patient.emergencyContact && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Name</dt>
                <dd className="mt-1 text-gray-900">{patient.emergencyContact.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Relationship</dt>
                <dd className="mt-1 text-gray-900">{patient.emergencyContact.relationship}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Phone</dt>
                <dd className="mt-1 text-gray-900">{patient.emergencyContact.phone}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Patient Timeline */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Patient Timeline</h2>
        {timelineItems.length > 0 ? (
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex gap-4 p-4 border-l-4 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{
                  borderLeftColor: item.type === 'appointment' ? '#3b82f6' : '#10b981',
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      item.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  >
                    {item.type === 'appointment' ? '📅' : '🦷'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h3>
                        {item.status && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : item.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {format(item.date, 'MMM dd, yyyy hh:mm a')}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
                      )}
                      {item.type === 'treatment' && 'cost' in item.data && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">
                          Cost: ${(item.data.cost || 0).toFixed(2)}
                          {item.data.paid !== undefined && item.data.paid > 0 && (
                            <span className="text-green-600 dark:text-green-400 ml-2">
                              (Paid: ${item.data.paid.toFixed(2)})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/${item.type === 'appointment' ? 'appointments' : 'treatments'}/${item.id}/edit`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No appointments or treatments recorded yet
          </p>
        )}
      </div>

      <DentalChart 
        initialData={patient.dentalChart || []} 
        onSave={(data) => saveChartMutation.mutate(data)}
        isLoading={saveChartMutation.isLoading}
        storageKey={`dentalChartState:${id}`}
        dentists={dentists || []}
      />
    </div>
  );
}
