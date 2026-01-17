import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ApiItemResponse, PatientSummary } from '../types/api';

interface PatientPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
  notes?: string;
}

const PHILIPPINES_PROVINCES = [
  'Abra',
  'Agusan del Norte',
  'Agusan del Sur',
  'Aklan',
  'Albay',
  'Antique',
  'Apayao',
  'Aurora',
  'Basilan',
  'Bataan',
  'Batanes',
  'Batangas',
  'Benguet',
  'Biliran',
  'Bohol',
  'Bukidnon',
  'Bulacan',
  'Cagayan',
  'Camarines Norte',
  'Camarines Sur',
  'Camiguin',
  'Capiz',
  'Catanduanes',
  'Cavite',
  'Cebu',
  'Compostela Valley',
  'Cotabato',
  'Davao de Oro',
  'Davao del Norte',
  'Davao del Sur',
  'Davao Occidental',
  'Davao Oriental',
  'Dinagat Islands',
  'Eastern Samar',
  'Guimaras',
  'Ifugao',
  'Ilocos Norte',
  'Ilocos Sur',
  'Iloilo',
  'Isabela',
  'Kalinga',
  'La Union',
  'Laguna',
  'Lanao del Norte',
  'Lanao del Sur',
  'Leyte',
  'Maguindanao del Norte',
  'Maguindanao del Sur',
  'Marinduque',
  'Masbate',
  'Misamis Occidental',
  'Misamis Oriental',
  'Mountain Province',
  'Negros Occidental',
  'Negros Oriental',
  'Northern Samar',
  'Nueva Ecija',
  'Nueva Vizcaya',
  'Occidental Mindoro',
  'Oriental Mindoro',
  'Palawan',
  'Pampanga',
  'Pangasinan',
  'Quezon',
  'Quirino',
  'Rizal',
  'Romblon',
  'Samar',
  'Sarangani',
  'Siquijor',
  'Sorsogon',
  'South Cotabato',
  'Southern Leyte',
  'Sultan Kudarat',
  'Sulu',
  'Surigao del Norte',
  'Surigao del Sur',
  'Tarlac',
  'Tawi-Tawi',
  'Zambales',
  'Zamboanga del Norte',
  'Zamboanga del Sur',
  'Zamboanga Sibugay',
];

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
    country: 'Philippines',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    allergies: '',
    medicalHistory: '',
    notes: '',
  });

  // Fetch patient data if editing
  const { data: patient, isLoading: isLoadingPatient } = useQuery<PatientSummary>(
    ['patient', id],
    async () => {
      const response = await api.get<ApiItemResponse<PatientSummary>>(`/patients/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  // Convert date to YYYY-MM-DD format for date input
  const toDateInputFormat = (value: string | Date): string => {
    if (!value) return '';
    
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Convert date input value (YYYY-MM-DD) to ISO date string for API
  const toIsoDate = (value: string): string => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    // Convert to ISO date string with time at midnight UTC
    // This ensures proper parsing on the backend
    const date = new Date(value + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
  };

  // Populate form when patient data loads
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth
          ? toDateInputFormat(patient.dateOfBirth)
          : '',
        gender: patient.gender || 'male',
        email: patient.email || '',
        phone: patient.phone || '',
        street: patient.address?.street || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        zipCode: patient.address?.zipCode || '',
        country: patient.address?.country || 'Philippines',
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
    async (data: PatientPayload) => {
      const response = await api.post<ApiItemResponse<PatientSummary>>('/patients', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Patient created successfully!');
        queryClient.invalidateQueries('patients');
        navigate('/patients');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to create patient';
        toast.error(message);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: PatientPayload) => {
      const response = await api.put<ApiItemResponse<PatientSummary>>(`/patients/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Patient updated successfully!');
        queryClient.invalidateQueries(['patient', id]);
        queryClient.invalidateQueries('patients');
        navigate(`/patients/${id}`);
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update patient';
        toast.error(message);
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

    const data: PatientPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: toIsoDate(formData.dateOfBirth),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Patient' : 'Add New Patient'}
        </h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-secondary no-print"
        >
          Print
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8 border border-gray-200 print-form">
        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Date of Birth *</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="input pr-10"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Gender *</label>
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

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Street / Lot / Block</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Barangay (Optional)</label>
                  <input
                    type="text"
                    name="barangay"
                    className="input"
                    placeholder="Optional (not stored)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Province</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                  >
                    <option value="">Select province</option>
                    {PHILIPPINES_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Country</label>
                  <input
                    list="country-list"
                    placeholder="Select or type a country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input"
                  />
                  <datalist id="country-list">
                    <option value="United States" />
                    <option value="Canada" />
                    <option value="United Kingdom" />
                    <option value="Australia" />
                    <option value="Philippines" />
                    <option value="Germany" />
                    <option value="France" />
                    <option value="Spain" />
                    <option value="Italy" />
                    <option value="Japan" />
                    <option value="China" />
                    <option value="India" />
                    <option value="Brazil" />
                    <option value="Mexico" />
                  </datalist>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Emergency Contact
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContactRelationship: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
                  <label className="label md:mb-0">Phone</label>
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
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Medical History</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Medical History (comma-separated)</label>
              <input
                type="text"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="input"
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Dental History</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Previous Dental Care (Optional)</label>
              <input
                type="text"
                name="dentalHistory"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Last Dental Visit (Optional)</label>
              <input
                type="text"
                name="lastDentalVisit"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Allergies &amp; Medications</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Allergies (comma-separated)</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="input"
                placeholder="e.g., Penicillin, Latex"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Current Medications (Optional)</label>
              <input
                type="text"
                name="medications"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Vitals</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Blood Pressure (Optional)</label>
              <input
                type="text"
                name="bloodPressure"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Pulse (Optional)</label>
              <input type="text" name="pulse" className="input" placeholder="Optional (not stored)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Temperature (Optional)</label>
              <input
                type="text"
                name="temperature"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Chief Complaint / Notes</h2>
          </div>
          <div className="p-4">
            <label className="label">Chief Complaint / Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={4}
            />
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Dental Chart</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              Dental charting is available in the patient profile. This section is a placeholder for a
              future integrated chart.
            </p>
            <button type="button" className="btn btn-secondary no-print" disabled>
              Open Dental Chart (coming soon)
            </button>
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Treatment Plan</h2>
          </div>
          <div className="p-4">
            <label className="label">Proposed Treatment (Optional)</label>
            <textarea
              name="treatmentPlan"
              className="input"
              rows={4}
              placeholder="Optional (not stored)"
            />
          </div>
        </section>

        <section className="print-section border border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Consent &amp; Signatures</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Patient Signature (Optional)</label>
              <input
                type="text"
                name="patientSignature"
                className="input"
                placeholder="Optional (not stored)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-4 md:items-center">
              <label className="label md:mb-0">Date (Optional)</label>
              <input type="text" name="consentDate" className="input" placeholder="Optional (not stored)" />
            </div>
          </div>
        </section>

        <div className="flex gap-4 pt-2 no-print">
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
