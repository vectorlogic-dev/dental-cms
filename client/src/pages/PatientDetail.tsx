import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery(
    ['patient', id],
    async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    { enabled: !!id }
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
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to deactivate patient');
      },
    }
  );

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to deactivate this patient?')) {
      deleteMutation.mutate();
    }
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
          <button onClick={handleDelete} className="btn btn-danger" disabled={deleteMutation.isLoading}>
            {deleteMutation.isLoading ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>

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
                {format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')}
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
    </div>
  );
}
