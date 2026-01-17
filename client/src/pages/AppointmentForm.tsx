import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import {
  ApiItemResponse,
  ApiListResponse,
  Appointment,
  PatientSummary,
  UserSummary,
} from '../types/api';

interface AppointmentPayload {
  patient: string;
  dentist: string;
  appointmentDate: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
}

export default function AppointmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [showCalendar, setShowCalendar] = useState(false);

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
  const { data: patients } = useQuery<PatientSummary[]>('patients-list', async () => {
    const response = await api.get<ApiListResponse<PatientSummary>>('/patients', { params: { limit: 1000 } });
    return response.data.data;
  });

  const { data: dentists } = useQuery<UserSummary[]>('dentists-list', async () => {
    const response = await api.get<ApiListResponse<UserSummary>>('/users', { params: { role: 'dentist' } });
    return response.data.data;
  });

  const { data: bookedAppointments } = useQuery<Appointment[]>(
    ['appointments-by-date', formData.dentist, formData.appointmentDate],
    async () => {
      const isoDate = toIsoDate(formData.appointmentDate);
      const startOfDay = new Date(`${isoDate}T00:00:00`);
      const endOfDay = new Date(`${isoDate}T23:59:59.999`);
      const response = await api.get('/appointments', {
        params: {
          dentistId: formData.dentist,
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          limit: 200,
        },
      });
      return (response.data as ApiListResponse<Appointment>).data;
    },
    { enabled: !!formData.dentist && !!formData.appointmentDate }
  );

  // Fetch appointment data if editing
  const { data: appointment, isLoading: isLoadingAppointment } = useQuery<Appointment>(
    ['appointment', id],
    async () => {
      const response = await api.get<ApiItemResponse<Appointment>>(`/appointments/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  const toIsoDate = (value: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const parts = value.split('/');
    if (parts.length !== 3) return value;

    const [month, day, year] = parts.map((part) => part.trim());
    if (!month || !day || !year) return value;

    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const month = digits.slice(0, 2);
    const day = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    if (digits.length <= 2) return month;
    if (digits.length <= 4) return `${month}/${day}`;
    return `${month}/${day}/${year}`;
  };

  const parseMmddyyyy = (value: string) => {
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts.map((part) => parseInt(part, 10));
    if (!month || !day || !year) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const isPastDate = (value: string) => {
    const parsed = parseMmddyyyy(value);
    if (!parsed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return parsed < today;
  };

  const blockedTimeSlots = useMemo(() => {
    const blocked = new Set<number>();
    if (!bookedAppointments || !formData.appointmentDate) return blocked;

    bookedAppointments.forEach((apt) => {
      if (apt._id === id) return;
      if (apt.status === 'cancelled' || apt.status === 'no-show') return;
      const start = new Date(apt.appointmentDate);
      const duration = Number(apt.duration) || 30;
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = startMinutes + duration;
      for (let t = startMinutes; t < endMinutes; t += 30) {
        blocked.add(t);
      }
    });

    return blocked;
  }, [bookedAppointments, formData.appointmentDate, id]);

  // Populate form when appointment data loads
  useEffect(() => {
    if (appointment) {
      const date = new Date(appointment.appointmentDate);
      setFormData({
        patient: typeof appointment.patient === 'string'
          ? appointment.patient
          : appointment.patient?._id || '',
        dentist: typeof appointment.dentist === 'string'
          ? appointment.dentist
          : appointment.dentist?._id || '',
        appointmentDate: format(date, 'MM/dd/yyyy'),
        appointmentTime: date.toTimeString().slice(0, 5),
        duration: appointment.duration?.toString() || '30',
        type: appointment.type || 'checkup',
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  const createMutation = useMutation(
    async (data: AppointmentPayload) => {
      const response = await api.post<ApiItemResponse<Appointment>>('/appointments', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Appointment scheduled successfully!');
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('today-appointments');
        navigate('/appointments');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to schedule appointment';
        toast.error(message);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: AppointmentPayload) => {
      const response = await api.put<ApiItemResponse<Appointment>>(`/appointments/${id}`, data);
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
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update appointment';
        toast.error(message);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPastDate(formData.appointmentDate)) {
      toast.error('Please select a future appointment date.');
      return;
    }

    const appointmentDateTime = new Date(
      `${toIsoDate(formData.appointmentDate)}T${formData.appointmentTime}`
    );

    const data: AppointmentPayload = {
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
              {patients?.map((patient) => (
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
              {dentists?.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.firstName} {dentist.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date *</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{2}/\d{2}/\d{4}"
                placeholder="MM/DD/YYYY"
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: formatDateInput(e.target.value) })
                }
                className="input pr-28"
                required
              />
              <button
                type="button"
                aria-label="Open calendar"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700"
                onClick={() => setShowCalendar((prev) => !prev)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              {showCalendar && (
                <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2">
                  <Calendar
                    onChange={(value) => {
                      const selected = Array.isArray(value) ? value[0] : value;
                      if (selected) {
                        setFormData({
                          ...formData,
                          appointmentDate: format(selected, 'MM/dd/yyyy'),
                        });
                        setShowCalendar(false);
                      }
                    }}
                    minDate={new Date()}
                    value={parseMmddyyyy(formData.appointmentDate) || new Date()}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Time *</label>
            <select
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              className="input"
              required
            >
              <option value="">Select time</option>
              {Array.from({ length: 18 }, (_, index) => {
                const totalMinutes = 8 * 60 + index * 30;
                const hours24 = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const timeValue = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
                const period = hours24 < 12 ? 'AM' : 'PM';
                const display = `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;

                const isBlocked = blockedTimeSlots.has(totalMinutes);

                return (
                  <option key={timeValue} value={timeValue} disabled={isBlocked}>
                    {display} {isBlocked ? '(Booked)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label">Duration (minutes) *</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="input"
              required
            >
              <option value="30">30 minutes</option>
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
