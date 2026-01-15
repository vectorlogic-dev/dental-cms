import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';

export default function PatientDetail() {
  const { id } = useParams();

  const { data: patient, isLoading } = useQuery(
    ['patient', id],
    async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    { enabled: !!id }
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center py-8">Patient not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {patient.firstName} {patient.lastName}
      </h1>

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
