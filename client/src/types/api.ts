export interface UserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface PatientSummary {
  _id: string;
  firstName: string;
  lastName: string;
  patientNumber?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
  notes?: string;
  dentalChart?: DentalChartEntry[];
}

export interface Appointment {
  _id: string;
  appointmentDate: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
  patient?: PatientSummary | string;
  dentist?: UserSummary | string;
}

export interface Treatment {
  _id: string;
  treatmentDate: string;
  procedure?: string;
  treatmentType?: string;
  diagnosis?: string;
  description?: string;
  status?: string;
  cost?: number;
  paid?: number;
  notes?: string;
  patient?: PatientSummary | string;
  dentist?: UserSummary | string;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
}

export interface DentalChartEntry {
  toothNumber: number;
  procedures: Array<{
    procedure: string;
    notes: string;
    date: string | Date;
    dentist?: UserSummary | string;
  }>;
}
