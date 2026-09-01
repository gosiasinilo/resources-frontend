export type JobStatus = 'INITIATED' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED';
export type JobType   = 'LOCATION' | 'ONLINE';

export interface Temp {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  rating?: number | null;
}

export interface TempDetail extends Temp {
  notes?: string;
  skills: string[];
  jobs: JobSummary[];
}

export interface JobSummary {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: JobStatus;
}

export interface AvailableTemp {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  rating?: number | null;
  available: boolean;
  nextAvailableStart: string;
  alternativeTemps: AlternativeTemp[];
}

export interface AlternativeTemp {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  rating?: number | null;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  jobType: JobType;
  status: JobStatus;
  startDate: string;
  endDate: string;
  city?: string | null;
  requiredSkills: string[];
  temp?: Temp | null;
  review?: JobReview | null;
}

export interface JobReview {
  id: number;
  workQuality: number;
  communication: number;
  onTime: number;
  comments?: string;
  reviewedBy: string;
}

export interface Skill {
  id: number;
  name: string;
}
