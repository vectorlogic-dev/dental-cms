import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import { ApiListResponse, PatientSummary, Treatment, UserSummary } from '../types/api';

type SortField = 'treatmentDate' | 'patient' | 'procedure' | 'cost' | 'status' | null;
type SortOrder = 'asc' | 'desc';

export default function Treatments() {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { data, isLoading } = useQuery<Treatment[]>('treatments', async () => {
    const response = await api.get<ApiListResponse<Treatment>>('/treatments', { params: { limit: 1000 } });
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

  const sortedTreatments = useMemo(() => {
    if (!data) return [];
    
    const sorted = [...data];
    const formatPersonNameForSort = (person?: PatientSummary | UserSummary | string): string =>
      formatPersonName(person).toLowerCase();
    
    if (sortField) {
      sorted.sort((a, b) => {
        let aValue = '';
        let bValue = '';
        
        switch (sortField) {
          case 'treatmentDate':
            {
              const aTime = new Date(a.treatmentDate).getTime();
              const bTime = new Date(b.treatmentDate).getTime();
              return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
            }
          case 'patient':
            aValue = formatPersonNameForSort(a.patient);
            bValue = formatPersonNameForSort(b.patient);
            break;
          case 'procedure':
            aValue = (a.procedure || '').toLowerCase();
            bValue = (b.procedure || '').toLowerCase();
            break;
          case 'cost':
            {
              const aCost = Number(a.cost || 0);
              const bCost = Number(b.cost || 0);
              return sortOrder === 'asc' ? aCost - bCost : bCost - aCost;
            }
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
        <h1 className="text-3xl font-bold text-gray-800">Treatments</h1>
        <Link to="/treatments/new" className="btn btn-primary">
          Add Treatment
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
                    onClick={() => handleSort('treatmentDate')}
                  >
                    Date <SortIcon field="treatmentDate" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('patient')}
                  >
                    Patient <SortIcon field="patient" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('procedure')}
                  >
                    Treatment <SortIcon field="procedure" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('cost')}
                  >
                    Cost <SortIcon field="cost" />
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTreatments.length > 0 ? (
                  sortedTreatments.map((treatment) => (
                    <tr key={treatment._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {format(new Date(treatment.treatmentDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        {formatPersonName(treatment.patient)}
                      </td>
                      <td className="py-3 px-4">{treatment.procedure}</td>
                      <td className="py-3 px-4">${(treatment.cost || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            treatment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : treatment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {treatment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/treatments/${treatment._id}/edit`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No treatments found
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
