export type ToothId = `${1 | 2 | 3 | 4}-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'missing'
  | 'filled'
  | 'crown'
  | 'root_canal'
  | 'implant'
  | 'extracted'
  | 'bridge';

export interface ToothState {
  id: ToothId;
  status: ToothStatus;
  notes: string;
  procedure: string;
  updatedAt: string; // ISO string
  dentist?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | string;
  history?: any[];
}

export type DentalChartState = Record<ToothId, ToothState>;

const QUADRANTS = [1, 2, 3, 4] as const;
const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function listAllToothIds(): ToothId[] {
  const ids: ToothId[] = [];
  for (const quadrant of QUADRANTS) {
    for (const position of POSITIONS) {
      ids.push(`${quadrant}-${position}` as ToothId);
    }
  }
  return ids;
}

export function createDefaultState(now: Date = new Date()): DentalChartState {
  const timestamp = now.toISOString();
  const state = {} as DentalChartState;
  for (const id of listAllToothIds()) {
    state[id] = {
      id,
      status: 'healthy',
      notes: '',
      procedure: '',
      updatedAt: timestamp,
      dentist: undefined,
      history: [],
    };
  }
  return state;
}
