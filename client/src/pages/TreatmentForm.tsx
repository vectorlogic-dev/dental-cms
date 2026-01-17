import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';
import {
  ApiItemResponse,
  ApiListResponse,
  Appointment,
  PatientSummary,
  Treatment,
  UserSummary,
} from '../types/api';

interface TreatmentDetails extends Treatment {
  appointment?: Appointment | string;
  treatmentType?: string;
  toothNumbers?: string[];
  diagnosis?: string;
  description?: string;
  paid?: number;
}

interface TreatmentPayload {
  patient: string;
  appointment?: string;
  dentist: string;
  treatmentDate: string;
  treatmentType: string;
  toothNumbers?: string[];
  diagnosis?: string;
  procedure: string;
  description?: string;
  cost: number;
  paid: number;
  status: string;
  notes?: string;
}

export default function TreatmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    patient: '',
    appointment: '',
    dentist: '',
    treatmentDate: new Date().toISOString().split('T')[0],
    treatmentType: '',
    toothNumbers: '',
    diagnosis: '',
    procedure: '',
    description: '',
    cost: '0',
    paid: '0',
    status: 'pending',
    notes: '',
  });

  // Fetch patients, dentists, and appointments
  const { data: patients } = useQuery<PatientSummary[]>('patients-list', async () => {
    const response = await api.get<ApiListResponse<PatientSummary>>('/patients', { params: { limit: 1000 } });
    return response.data.data;
  });

  const { data: dentists } = useQuery<UserSummary[]>('dentists-list', async () => {
    const response = await api.get<ApiListResponse<UserSummary>>('/users', { params: { role: 'dentist' } });
    return response.data.data;
  });

  const { data: appointments } = useQuery<Appointment[]>(
    ['appointments-list', formData.patient],
    async () => {
      if (!formData.patient) return [];
      const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
        params: { patientId: formData.patient, limit: 100 },
      });
      return response.data.data;
    },
    { enabled: !!formData.patient }
  );

  // Fetch selected appointment details when appointment is selected
  const { data: selectedAppointment } = useQuery<Appointment>(
    ['appointment', formData.appointment],
    async () => {
      const response = await api.get<ApiItemResponse<Appointment>>(`/appointments/${formData.appointment}`);
      return response.data.data;
    },
    { enabled: !!formData.appointment && !isEdit }
  );

  // Auto-fill treatment date when appointment is selected (only for new treatments)
  useEffect(() => {
    if (selectedAppointment && !isEdit) {
      const appointmentDate = new Date(selectedAppointment.appointmentDate);
      const dateString = appointmentDate.toISOString().split('T')[0];
      setFormData((prev) => ({
        ...prev,
        treatmentDate: dateString,
      }));
    }
  }, [selectedAppointment, isEdit]);

  // Fetch treatment data if editing
  const { data: treatment, isLoading: isLoadingTreatment } = useQuery<TreatmentDetails>(
    ['treatment', id],
    async () => {
      const response = await api.get<ApiItemResponse<TreatmentDetails>>(`/treatments/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  // Populate form when treatment data loads
  useEffect(() => {
    if (treatment) {
      setFormData({
        patient: typeof treatment.patient === 'string'
          ? treatment.patient
          : treatment.patient?._id || '',
        appointment: typeof treatment.appointment === 'string'
          ? treatment.appointment
          : treatment.appointment?._id || '',
        dentist: typeof treatment.dentist === 'string'
          ? treatment.dentist
          : treatment.dentist?._id || '',
        treatmentDate: treatment.treatmentDate
          ? new Date(treatment.treatmentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        treatmentType: treatment.treatmentType || '',
        toothNumbers: treatment.toothNumbers?.join(', ') || '',
        diagnosis: treatment.diagnosis || '',
        procedure: treatment.procedure || '',
        description: treatment.description || '',
        cost: treatment.cost?.toString() || '0',
        paid: treatment.paid?.toString() || '0',
        status: treatment.status || 'pending',
        notes: treatment.notes || '',
      });
    }
  }, [treatment]);

  const createMutation = useMutation(
    async (data: TreatmentPayload) => {
      const response = await api.post<ApiItemResponse<TreatmentDetails>>('/treatments', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Treatment created successfully!');
        queryClient.invalidateQueries('treatments');
        navigate('/treatments');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to create treatment';
        toast.error(message);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: TreatmentPayload) => {
      const response = await api.put<ApiItemResponse<TreatmentDetails>>(`/treatments/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Treatment updated successfully!');
        queryClient.invalidateQueries(['treatment', id]);
        queryClient.invalidateQueries('treatments');
        navigate('/treatments');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update treatment';
        toast.error(message);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toothNumbers = formData.toothNumbers
      ? formData.toothNumbers.split(',').map((t) => t.trim()).filter((t) => t)
      : undefined;

    const data: TreatmentPayload = {
      patient: formData.patient,
      appointment: formData.appointment || undefined,
      dentist: formData.dentist,
      treatmentDate: new Date(formData.treatmentDate).toISOString(),
      treatmentType: formData.treatmentType,
      toothNumbers,
      diagnosis: formData.diagnosis || undefined,
      procedure: formData.procedure,
      description: formData.description || undefined,
      cost: parseFloat(formData.cost),
      paid: parseFloat(formData.paid),
      status: formData.status,
      notes: formData.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoadingTreatment) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isEdit ? 'Edit Treatment' : 'Add New Treatment'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Patient *</label>
            <select
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value, appointment: '' })}
              className="input"
              required
            >
              <option value="">Select a patient</option>
              {patients?.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName} ({patient.patientNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Appointment (Optional)</label>
            <select
              value={formData.appointment}
              onChange={(e) => setFormData({ ...formData, appointment: e.target.value })}
              className="input"
              disabled={!formData.patient}
            >
              <option value="">No appointment</option>
              {appointments?.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {format(new Date(apt.appointmentDate), 'MM/dd/yyyy hh:mm a')} - {apt.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Dentist *</label>
            <select
              value={formData.dentist}
              onChange={(e) => setFormData({ ...formData, dentist: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a dentist</option>
              {dentists?.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.firstName} {dentist.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Treatment Date *</label>
            <input
              type="date"
              value={formData.treatmentDate}
              onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Treatment Type *</label>
            <input
              type="text"
              value={formData.treatmentType}
              onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
              className="input"
              placeholder="e.g., Restorative, Preventive, Cosmetic"
              required
            />
          </div>

          <div>
            <label className="label">Procedure *</label>
            <input
              type="text"
              value={formData.procedure}
              onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
              className="input"
              placeholder="e.g., Filling, Extraction, Cleaning"
              required
            />
          </div>

          <div>
            <label className="label">Tooth Numbers (comma-separated)</label>
            <input
              type="text"
              value={formData.toothNumbers}
              onChange={(e) => setFormData({ ...formData, toothNumbers: e.target.value })}
              className="input"
              placeholder="e.g., 12, 13, 14"
            />
          </div>

          <div>
            <label className="label">Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="input"
              placeholder="Diagnosis details"
            />
          </div>

          <div>
            <label className="label">Cost *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Paid</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.paid}
              onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
              required
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            rows={3}
            placeholder="Treatment description..."
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Additional notes..."
          />
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
              ? 'Update Treatment'
              : 'Create Treatment'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
