import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery(
    ['patients', page, search],
    async () => {
      const response = await api.get('/patients', {
        params: { page, limit: 10, search },
      });
      return response.data;
    }
  );

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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((patient: any) => (
                    <tr key={patient._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{patient.patientNumber}</td>
                      <td className="py-3 px-4">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="py-3 px-4">{patient.phone}</td>
                      <td className="py-3 px-4">{patient.email || '-'}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/patients/${patient._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && (
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Page {data.pagination.page} of {data.pagination.pages}
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
                    disabled={page >= data.pagination.pages}
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
