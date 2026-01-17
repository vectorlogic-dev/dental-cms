import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { ApiListResponse, Appointment } from '../types/api';
import { formatPersonName } from '../utils/formatting';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const isMonthView = view === 'month';
  const rangeStart = isMonthView ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate);
  const rangeEnd = isMonthView ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate);

  const { data: appointments, isLoading } = useQuery<Appointment[]>(
    ['appointments', view, format(rangeStart, 'yyyy-MM-dd')],
    async () => {
      const response = await api.get<ApiListResponse<Appointment>>('/appointments', {
        params: {
          startDate: rangeStart.toISOString(),
          endDate: rangeEnd.toISOString(),
          limit: 200,
        },
      });
      return response.data.data;
    }
  );

  const nextPeriod = () =>
    setCurrentDate(isMonthView ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prevPeriod = () =>
    setCurrentDate(isMonthView ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const toggleDayExpanded = (dayKey: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };


  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Calendar</h1>
        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'month'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'week'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={prevPeriod}
            className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
            aria-label="Previous period"
          >
            <span className="text-lg font-semibold leading-none" aria-hidden="true">
              &lt;
            </span>
          </button>
          <div className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100 border-x border-gray-200 dark:border-gray-700 min-w-[150px] text-center">
            {isMonthView
              ? format(currentDate, 'MMMM yyyy')
              : `${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d')}`}
          </div>
          <button
            onClick={nextPeriod}
            className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
            aria-label="Next period"
          >
            <span className="text-lg font-semibold leading-none" aria-hidden="true">
              &gt;
            </span>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="btn btn-secondary dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Today
        </button>
        <Link to="/appointments/new" className="btn btn-primary">
          + New Appointment
        </Link>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = isMonthView ? startOfWeek(monthStart) : startOfWeek(currentDate);
    const endDate = isMonthView ? endOfWeek(monthEnd) : endOfWeek(currentDate);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-700 gap-px rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        {calendarDays.map((day) => {
          const dayAppointments =
            appointments?.filter((apt) =>
              isSameDay(new Date(apt.appointmentDate), day)
            ) || [];

          const maxItems = isMonthView ? 4 : 8;
          const dayKey = format(day, 'yyyy-MM-dd');
          const isExpanded = expandedDays[dayKey];
          const visibleAppointments = isExpanded
            ? dayAppointments
            : dayAppointments.slice(0, maxItems);

          return (
            <div
              key={day.toString()}
              className={`bg-white dark:bg-gray-900 p-2 transition-colors ${
                isMonthView ? 'min-h-[140px]' : 'min-h-[45vh]'
              } ${
                isMonthView && !isSameMonth(day, monthStart)
                  ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${
                  isToday(day) 
                    ? 'bg-primary-600 text-white' 
                    : !isMonthView || isSameMonth(day, monthStart)
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className={`space-y-1 overflow-y-auto scrollbar-hide ${
                isMonthView ? 'max-h-[100px]' : 'max-h-[35vh]'
              }`}>
                {visibleAppointments.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/appointments/${apt._id}/edit`}
                    className={`block px-2 py-1 text-[10px] sm:text-xs rounded-md border truncate transition-all hover:shadow-md ${getStatusStyles(apt.status || 'scheduled')}`}
                  >
                    <span className="font-bold mr-1">{format(new Date(apt.appointmentDate), 'HH:mm')}</span>
                    {formatPersonName(apt.patient)}
                  </Link>
                ))}
                {dayAppointments.length > maxItems && (
                  <button
                    type="button"
                    onClick={() => toggleDayExpanded(dayKey)}
                    className="text-[10px] text-gray-600 dark:text-gray-300 px-1 font-semibold text-left hover:underline"
                  >
                    {isExpanded
                      ? 'Show less'
                      : `+ ${dayAppointments.length - maxItems} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40';
      case 'in-progress':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40';
      case 'no-show':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700';
      default:
        return 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-900/40';
    }
  };

  return (
    <div className="h-full">
      {renderHeader()}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
        {renderDays()}
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          renderCells()
        )}
      </div>
    </div>
  );
}
