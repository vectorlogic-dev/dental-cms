import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';

export default function Treatments() {
  const { data, isLoading } = useQuery('treatments', async () => {
    const response = await api.get('/treatments', { params: { limit: 50 } });
    return response.data.data;
  });

  const sortedTreatments = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a: any, b: any) => {
      const aTime = new Date(a.treatmentDate).getTime();
      const bTime = new Date(b.treatmentDate).getTime();
      return aTime - bTime;
    });
  }, [data]);

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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Treatment</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTreatments.length > 0 ? (
                  sortedTreatments.map((treatment: any) => (
                    <tr key={treatment._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {format(new Date(treatment.treatmentDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        {treatment.patient?.firstName} {treatment.patient?.lastName}
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
