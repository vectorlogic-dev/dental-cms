import { useEffect, useMemo, useRef } from 'react';
import {
  createDefaultState,
  DentalChart as DentalChartModule,
  DentalChartState,
  listAllToothIds,
  ToothId,
  DentistRef,
  ToothHistoryEntry,
} from '../features/dental-chart';

interface Procedure extends ToothHistoryEntry {
  procedure: string;
  notes: string;
  date: string | Date;
}

interface ToothData {
  toothNumber: number;
  procedures: Procedure[];
}

interface DentalChartProps {
  initialData?: ToothData[];
  onSave: (data: ToothData[]) => void;
  isLoading?: boolean;
  storageKey?: string;
  dentists?: DentistRef[];
}

const toToothId = (toothNumber: number): ToothId | null => {
  if (toothNumber >= 1 && toothNumber <= 8) {
    return `1-${9 - toothNumber}` as ToothId;
  }
  if (toothNumber >= 9 && toothNumber <= 16) {
    return `2-${toothNumber - 8}` as ToothId;
  }
  if (toothNumber >= 17 && toothNumber <= 24) {
    return `3-${25 - toothNumber}` as ToothId;
  }
  if (toothNumber >= 25 && toothNumber <= 32) {
    return `4-${toothNumber - 24}` as ToothId;
  }
  return null;
};

const toToothNumber = (id: ToothId): number => {
  const [quadrantText, positionText] = id.split('-');
  const quadrant = Number(quadrantText);
  const position = Number(positionText);
  if (quadrant === 1) {
    return 9 - position;
  }
  if (quadrant === 2) {
    return 8 + position;
  }
  if (quadrant === 3) {
    return 25 - position;
  }
  return 24 + position;
};

const getLatestProcedure = (procedures: Procedure[]): Procedure | null => {
  if (procedures.length === 0) return null;
  return procedures.reduce((latest, current) => {
    const latestDate = new Date(latest.date).getTime();
    const currentDate = new Date(current.date).getTime();
    return currentDate > latestDate ? current : latest;
  });
};

const mapInitialDataToState = (data?: ToothData[]): DentalChartState => {
  const state = createDefaultState();
  if (!data || data.length === 0) return state;
  for (const tooth of data) {
    const id = toToothId(tooth.toothNumber);
    if (!id) continue;
    const latest = getLatestProcedure(tooth.procedures);
    if (!latest) continue;
    state[id] = {
      id,
      status: latest.procedure ? 'filled' : 'healthy',
      notes: latest.notes ?? '',
      procedure: latest.procedure ?? '',
      dentist: latest.dentist,
      history: tooth.procedures,
      updatedAt: new Date(latest.date).toISOString(),
    };
  }
  return state;
};

const mapStateToBackend = (state: DentalChartState): ToothData[] => {
  const entries: ToothData[] = [];
  for (const id of listAllToothIds()) {
    const tooth = state[id];
    if (!tooth.procedure && !tooth.notes) continue;
    entries.push({
      toothNumber: toToothNumber(id),
      procedures: [
        {
          procedure: tooth.procedure,
          notes: tooth.notes,
          date: tooth.updatedAt,
          dentist: typeof tooth.dentist === 'object' ? tooth.dentist._id : tooth.dentist,
        },
      ],
    });
  }
  return entries;
};

export default function DentalChart({
  initialData = [],
  onSave,
  isLoading,
  storageKey,
  dentists = [],
}: DentalChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<DentalChartModule | null>(null);
  const initialState = useMemo(
    () => mapInitialDataToState(initialData),
    [initialData]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const chart = new DentalChartModule(host, {
      initialState,
      storageKey,
      dentists,
      onChange: (state) => onSave(mapStateToBackend(state)),
    });
    chart.mount();
    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [initialState, onSave, storageKey, dentists]);

  return (
    <div className="card mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Interactive Dental Chart
      </h2>
      <div ref={hostRef} />
      {isLoading && (
        <p className="text-sm text-gray-500 mt-3">Saving chart...</p>
      )}
    </div>
  );
}
