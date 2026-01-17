import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import DentalChart from '../components/DentalChart';
import axios from 'axios';
import { ApiItemResponse, ApiListResponse, DentalChartEntry, PatientSummary, UserSummary } from '../types/api';

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
