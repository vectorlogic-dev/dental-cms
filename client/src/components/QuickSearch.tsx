import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/api';
import { ApiListResponse, PatientSummary, Appointment, UserSummary } from '../types/api';
import { formatPersonName } from '../utils/formatting';
import { format } from 'date-fns';

interface SearchResult {
  type: 'patient' | 'appointment' | 'dentist';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export default function QuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: patients } = useQuery<PatientSummary[]>(
    ['patients-search', query],
    async () => {
      if (!query || query.length < 2) return [];
      const response = await api.get<ApiListResponse<PatientSummary>>('/patients', {
        params: { limit: 5, search: query },
      });
      return response.data.data;
    },
    { enabled: query.length >= 2 }
  );

  const { data: appointments } = useQuery<Appointment[]>(
    ['appointments-search', query],
    async () => {
      if (!query || query.length < 2) return [];
      const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
        params: { limit: 5 },
      });
      return response.data.data;
    },
    { enabled: query.length >= 2 }
  );

  const { data: dentists } = useQuery<UserSummary[]>(
    ['dentists-search', query],
    async () => {
      if (!query || query.length < 2) return [];
      const response = await api.get<ApiListResponse<UserSummary>>('/users', {
        params: { role: 'dentist', limit: 10 },
      });
      return response.data.data;
    },
    { enabled: query.length >= 2 }
  );

  const results: SearchResult[] = [];

  // Add patient results
  if (patients) {
    patients.forEach((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const searchLower = query.toLowerCase();
      if (
        fullName.includes(searchLower) ||
        patient.patientNumber?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.phone?.includes(searchLower)
      ) {
        results.push({
          type: 'patient',
          id: patient._id,
          title: `${patient.firstName} ${patient.lastName}`,
          subtitle: patient.patientNumber ? `#${patient.patientNumber}` : undefined,
          url: `/patients/${patient._id}`,
        });
      }
    });
  }

  // Add appointment results (search by patient name or date)
  if (appointments) {
    const searchLower = query.toLowerCase();
    appointments.forEach((apt) => {
      const patientName = formatPersonName(apt.patient).toLowerCase();
      const aptDate = format(new Date(apt.appointmentDate), 'MM/dd/yyyy');
      if (patientName.includes(searchLower) || aptDate.includes(query)) {
        results.push({
          type: 'appointment',
          id: apt._id,
          title: `${formatPersonName(apt.patient)} - ${apt.type}`,
          subtitle: format(new Date(apt.appointmentDate), 'MM/dd/yyyy hh:mm a'),
          url: `/appointments/${apt._id}/edit`,
        });
      }
    });
  }

  // Add dentist results
  if (dentists) {
    const searchLower = query.toLowerCase();
    dentists.forEach((dentist) => {
      const fullName = `${dentist.firstName} ${dentist.lastName}`.toLowerCase();
      const email = dentist.email?.toLowerCase() || '';
      if (
        fullName.includes(searchLower) ||
        email.includes(searchLower)
      ) {
        results.push({
          type: 'dentist',
          id: dentist._id,
          title: `Dr. ${dentist.firstName} ${dentist.lastName}`,
          subtitle: dentist.email || 'Dentist',
          url: `/users/${dentist._id}/edit`,
        });
      }
    });
  }

  // Limit to 10 results (increased to accommodate dentists)
  const displayResults = results.slice(0, 10);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    handleClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close (handled in component's handleKeyDown for input focus)
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, displayResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && displayResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(displayResults[selectedIndex]);
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm">Search...</span>
        <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
          Ctrl+K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search patients, appointments, dentists..."
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close search"
                  title="Close (Esc)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {query.length >= 2 && displayResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {displayResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        result.type === 'patient' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          : result.type === 'appointment'
                          ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                      }`}>
                        {result.type === 'patient' ? '👤' : result.type === 'appointment' ? '📅' : '🦷'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query.length >= 2 && displayResults.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No results found
              </div>
            )}
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
