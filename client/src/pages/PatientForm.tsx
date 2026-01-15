import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    allergies: '',
    medicalHistory: '',
    notes: '',
  });

  // Fetch patient data if editing
  const { data: patient, isLoading: isLoadingPatient } = useQuery(
    ['patient', id],
    async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  // Populate form when patient data loads
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient.gender || 'male',
        email: patient.email || '',
        phone: patient.phone || '',
        street: patient.address?.street || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        zipCode: patient.address?.zipCode || '',
        country: patient.address?.country || 'USA',
        emergencyContactName: patient.emergencyContact?.name || '',
        emergencyContactRelationship: patient.emergencyContact?.relationship || '',
        emergencyContactPhone: patient.emergencyContact?.phone || '',
        allergies: patient.allergies?.join(', ') || '',
        medicalHistory: patient.medicalHistory?.join(', ') || '',
        notes: patient.notes || '',
      });
    }
  }, [patient]);

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/patients', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Patient created successfully!');
        queryClient.invalidateQueries('patients');
        navigate('/patients');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create patient');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const response = await api.put(`/patients/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Patient updated successfully!');
        queryClient.invalidateQueries(['patient', id]);
        queryClient.invalidateQueries('patients');
        navigate(`/patients/${id}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update patient');
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const address = formData.street || formData.city || formData.state || formData.zipCode
      ? {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        }
      : undefined;

    const emergencyContact = formData.emergencyContactName || formData.emergencyContactPhone
      ? {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        }
      : undefined;

    const allergies = formData.allergies
      ? formData.allergies.split(',').map((a) => a.trim()).filter((a) => a)
      : undefined;

    const medicalHistory = formData.medicalHistory
      ? formData.medicalHistory.split(',').map((h) => h.trim()).filter((h) => h)
      : undefined;

    const data = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      email: formData.email || undefined,
      phone: formData.phone,
      address,
      emergencyContact,
      allergies,
      medicalHistory,
      notes: formData.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoadingPatient) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isEdit ? 'Edit Patient' : 'Add New Patient'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="input"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Zip Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Relationship</label>
              <input
                type="text"
                value={formData.emergencyContactRelationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactRelationship: e.target.value })
                }
                className="input"
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactPhone: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Allergies (comma-separated)</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="input"
                placeholder="e.g., Penicillin, Latex"
              />
            </div>

            <div>
              <label className="label">Medical History (comma-separated)</label>
              <input
                type="text"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="input"
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="btn btn-primary"
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : isEdit
              ? 'Update Patient'
              : 'Create Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
