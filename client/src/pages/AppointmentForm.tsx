import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function AppointmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    patient: '',
    dentist: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: '30',
    type: 'checkup',
    status: 'scheduled',
    notes: '',
  });

  // Fetch patients and dentists
  const { data: patients } = useQuery('patients-list', async () => {
    const response = await api.get('/patients', { params: { limit: 1000 } });
    return response.data.data;
  });

  const { data: dentists } = useQuery('dentists-list', async () => {
    const response = await api.get('/users', { params: { role: 'dentist' } });
    return response.data.data;
  });

  // Fetch appointment data if editing
  const { data: appointment, isLoading: isLoadingAppointment } = useQuery(
    ['appointment', id],
    async () => {
      const response = await api.get(`/appointments/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  // Populate form when appointment data loads
  useEffect(() => {
    if (appointment) {
      const date = new Date(appointment.appointmentDate);
      setFormData({
        patient: appointment.patient._id || appointment.patient,
        dentist: appointment.dentist._id || appointment.dentist,
        appointmentDate: date.toISOString().split('T')[0],
        appointmentTime: date.toTimeString().slice(0, 5),
        duration: appointment.duration?.toString() || '30',
        type: appointment.type || 'checkup',
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/appointments', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Appointment scheduled successfully!');
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('today-appointments');
        navigate('/appointments');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to schedule appointment');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Appointment updated successfully!');
        queryClient.invalidateQueries(['appointment', id]);
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('today-appointments');
        navigate('/appointments');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update appointment');
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const appointmentDateTime = new Date(
      `${formData.appointmentDate}T${formData.appointmentTime}`
    );

    const data = {
      patient: formData.patient,
      dentist: formData.dentist,
      appointmentDate: appointmentDateTime.toISOString(),
      duration: parseInt(formData.duration),
      type: formData.type,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoadingAppointment) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isEdit ? 'Edit Appointment' : 'Schedule New Appointment'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Patient *</label>
            <select
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a patient</option>
              {patients?.map((patient: any) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName} ({patient.patientNumber})
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
              {dentists?.map((dentist: any) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.firstName} {dentist.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Time *</label>
            <input
              type="time"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Duration (minutes) *</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="input"
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          <div>
            <label className="label">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              required
            >
              <option value="checkup">Checkup</option>
              <option value="cleaning">Cleaning</option>
              <option value="treatment">Treatment</option>
              <option value="consultation">Consultation</option>
              <option value="emergency">Emergency</option>
              <option value="follow-up">Follow-up</option>
            </select>
          </div>

          <div>
            <label className="label">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
              required
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={4}
            placeholder="Additional notes about the appointment..."
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
              ? 'Update Appointment'
              : 'Schedule Appointment'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
