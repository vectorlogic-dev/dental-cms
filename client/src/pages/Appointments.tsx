import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import { Appointment, ApiListResponse, PatientSummary, UserSummary } from '../types/api';

type SortField = 'appointmentDate' | 'patient' | 'dentist' | 'type' | 'status' | null;
type SortOrder = 'asc' | 'desc';

export default function Appointments() {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<Appointment[]>('appointments', async () => {
    const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
      params: { limit: 1000 },
    });
    return response.data.data;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatPersonName = (person?: PatientSummary | UserSummary | string): string => {
    if (!person || typeof person === 'string') return '';
    return `${person.firstName || ''} ${person.lastName || ''}`.trim();
  };

  const sortedAppointments = useMemo(() => {
    if (!data) return [];
    
    const sorted = [...data];
    const formatPersonNameForSort = (person?: PatientSummary | UserSummary | string): string =>
      formatPersonName(person).toLowerCase();
    
    if (sortField) {
      sorted.sort((a, b) => {
        let aValue = '';
        let bValue = '';
        
        switch (sortField) {
          case 'appointmentDate':
            {
              const aTime = new Date(a.appointmentDate).getTime();
              const bTime = new Date(b.appointmentDate).getTime();
              return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
            }
          case 'patient':
            aValue = formatPersonNameForSort(a.patient);
            bValue = formatPersonNameForSort(b.patient);
            break;
          case 'dentist':
            aValue = formatPersonNameForSort(a.dentist);
            bValue = formatPersonNameForSort(b.dentist);
            break;
          case 'type':
            aValue = (a.type || '').toLowerCase();
            bValue = (b.type || '').toLowerCase();
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          default:
            return 0;
        }
        
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    return sorted;
  }, [data, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    
    return (
      <span className="ml-1 text-primary-600">
        {sortOrder === 'asc' ? (
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
        <Link to="/appointments/new" className="btn btn-primary">
          Schedule Appointment
        </Link>
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('appointmentDate')}
                  >
                    Date & Time <SortIcon field="appointmentDate" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('patient')}
                  >
                    Patient <SortIcon field="patient" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('dentist')}
                  >
                    Dentist <SortIcon field="dentist" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('type')}
                  >
                    Type <SortIcon field="type" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAppointments && sortedAppointments.length > 0 ? (
                  sortedAppointments.map((apt) => (
                  <tr 
                    key={apt._id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/appointments/${apt._id}/edit`)}
                  >
                    <td className="py-3 px-4">
                      {format(new Date(apt.appointmentDate), 'MM/dd/yyyy hh:mm a')}
                    </td>
                    <td className="py-3 px-4">
                      {formatPersonName(apt.patient)}
                    </td>
                    <td className="py-3 px-4">
                      {formatPersonName(apt.dentist)}
                    </td>
                    <td className="py-3 px-4 capitalize">{apt.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
