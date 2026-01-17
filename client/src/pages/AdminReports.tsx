import { useState } from 'react';
import api from '../utils/api';

interface QueryResult {
  data: Record<string, unknown>[];
  count?: number;
  executionTime?: number;
}

export default function AdminReports() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collection, setCollection] = useState('patients');

  const collections = [
    { value: 'patients', label: 'Patients' },
    { value: 'appointments', label: 'Appointments' },
    { value: 'treatments', label: 'Treatments' },
    { value: 'users', label: 'Users' },
  ];

  const exampleQueries = {
    patients: JSON.stringify(
      { firstName: { $regex: 'John', $options: 'i' } },
      null,
      2
    ),
    appointments: JSON.stringify(
      { status: 'scheduled', date: { $gte: '2024-01-01' } },
      null,
      2
    ),
    treatments: JSON.stringify(
      { status: 'completed' },
      null,
      2
    ),
    users: JSON.stringify(
      { role: 'dentist', isActive: true },
      null,
      2
    ),
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const parsedQuery = JSON.parse(query);
      const response = await api.post('/admin/query', {
        collection,
        query: parsedQuery,
      });
      setResults(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error executing query';
      setError(message);
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!results?.data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(results.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${collection}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      if (results.data.length === 0) return;

      const headers = Object.keys(results.data[0]);
      
      // Helper function to format dates for CSV (date only, no time)
      const formatValueForCSV = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        
        const stringValue = String(value);
        
        // Check if it's an ISO date string (contains T and Z or time)
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (isoDateRegex.test(stringValue)) {
          // Extract just the date part (YYYY-MM-DD)
          return stringValue.split('T')[0];
        }
        
        // Check if it's a date-only string in ISO format
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateOnlyRegex.test(stringValue)) {
          return stringValue;
        }
        
        return stringValue.replace(/"/g, '""');
      };
      
      const csvRows = [
        headers.join(','),
        ...results.data.map((row) =>
          headers
            .map((header) => formatValueForCSV(row[header]))
            .map((v) => `"${v}"`)
            .join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${collection}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (!results?.data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const headers = results.data.length > 0 ? Object.keys(results.data[0]) : [];

    printWindow.document.write(`
      <html>
        <head>
          <title>Report - ${collection}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Report: ${collection}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${results.count || results.data.length}</p>
          ${results.executionTime ? `<p>Execution Time: ${results.executionTime}ms</p>` : ''}
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${results.data
                .map(
                  (row) =>
                    `<tr>${headers
                      .map((h) => {
                        const value = row[h];
                        if (value === null || value === undefined) return '<td></td>';
                        if (typeof value === 'object')
                          return `<td>${JSON.stringify(value)}</td>`;
                        return `<td>${String(value)}</td>`;
                      })
                      .join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const loadExample = () => {
    setQuery(exampleQueries[collection as keyof typeof exampleQueries] || '{}');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Reports & Query Tool</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection
            </label>
            <select
              value={collection}
              onChange={(e) => {
                setCollection(e.target.value);
                setQuery('');
                setResults(null);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {collections.map((col) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              MongoDB Query (JSON)
            </label>
            <button
              onClick={loadExample}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Load Example
            </button>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Enter MongoDB query as JSON...\nExample: ${JSON.stringify({ firstName: 'John' }, null, 2)}`}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use MongoDB query syntax in JSON format. Supports find(), count(), aggregate() operations.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleExecute}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Executing...' : 'Execute Query'}
          </button>
          {results && (
            <>
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
              >
                Print
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="btn btn-secondary"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="btn btn-secondary"
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Results</h2>
            <div className="text-sm text-gray-600">
              {results.count !== undefined ? (
                <span>Count: {results.count}</span>
              ) : (
                <span>Records: {results.data.length}</span>
              )}
              {results.executionTime && (
                <span className="ml-4">Time: {results.executionTime}ms</span>
              )}
            </div>
          </div>

          {results.data.length === 0 ? (
            <p className="text-gray-500">No results found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(results.data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.data.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.keys(results.data[0]).map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {row[key] === null || row[key] === undefined
                            ? ''
                            : typeof row[key] === 'object'
                            ? JSON.stringify(row[key])
                            : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.data.length > 100 && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing first 100 of {results.data.length} results
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
