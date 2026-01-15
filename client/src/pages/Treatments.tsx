import { useQuery } from 'react-query';
import api from '../utils/api';
import { format } from 'date-fns';

export default function Treatments() {
  const { data, isLoading } = useQuery('treatments', async () => {
    const response = await api.get('/treatments', { params: { limit: 50 } });
    return response.data.data;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Treatments</h1>
        <button className="btn btn-primary">Add Treatment</button>
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
                </tr>
              </thead>
              <tbody>
                {data?.map((treatment: any) => (
                  <tr key={treatment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(treatment.treatmentDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      {treatment.patient?.firstName} {treatment.patient?.lastName}
                    </td>
                    <td className="py-3 px-4">{treatment.procedure}</td>
                    <td className="py-3 px-4">${treatment.cost.toFixed(2)}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
