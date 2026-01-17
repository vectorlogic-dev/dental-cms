import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ApiListResponse, PatientSummary } from '../types/api';

type SortField = 'patientNumber' | 'firstName' | 'lastName' | 'phone' | 'email' | null;
type SortOrder = 'asc' | 'desc';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<ApiListResponse<PatientSummary>>(
    ['patients', page, search],
    async () => {
      const response = await api.get<ApiListResponse<PatientSummary>>('/patients', {
        params: { page, limit: 1000, search }, // Get more records for client-side sorting
      });
      return response.data;
    }
  );

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Sort patients client-side
  const sortedPatients = useMemo(() => {
    if (!data?.data) return [];
    
    const sorted = [...data.data];
    
    if (sortField) {
      sorted.sort((a, b) => {
        let aValue: string;
        let bValue: string;
        
        switch (sortField) {
          case 'patientNumber':
            aValue = a.patientNumber || '';
            bValue = b.patientNumber || '';
            break;
          case 'firstName':
            aValue = (a.firstName || '').toLowerCase();
            bValue = (b.firstName || '').toLowerCase();
            break;
          case 'lastName':
            aValue = (a.lastName || '').toLowerCase();
            bValue = (b.lastName || '').toLowerCase();
            break;
          case 'phone':
            aValue = a.phone || '';
            bValue = b.phone || '';
            break;
          case 'email':
            aValue = (a.email || '').toLowerCase();
            bValue = (b.email || '').toLowerCase();
            break;
          default:
            return 0;
        }
        
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination after sorting
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return sorted.slice(startIndex, endIndex);
  }, [data?.data, sortField, sortOrder, page]);

  const totalPages = useMemo(() => {
    const total = data?.data?.length || 0;
    return Math.ceil(total / 10);
  }, [data?.data]);

  // Render sort icon
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
        <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
        <Link to="/patients/new" className="btn btn-primary">
          Add Patient
        </Link>
      </div>

      <div className="card mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input"
        />
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('patientNumber')}
                    >
                      Patient # <SortIcon field="patientNumber" />
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('firstName')}
                    >
                      First Name <SortIcon field="firstName" />
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('lastName')}
                    >
                      Last Name <SortIcon field="lastName" />
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('phone')}
                    >
                      Phone <SortIcon field="phone" />
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortIcon field="email" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients && sortedPatients.length > 0 ? (
                    sortedPatients.map((patient) => (
                      <tr
                        key={patient._id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/patients/${patient._id}`)}
                      >
                        <td className="py-3 px-4">{patient.patientNumber}</td>
                        <td className="py-3 px-4">{patient.firstName}</td>
                        <td className="py-3 px-4">{patient.lastName}</td>
                        <td className="py-3 px-4">{patient.phone}</td>
                        <td className="py-3 px-4">{patient.email || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No patients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages} ({(data?.data?.length || 0)} total patients)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
