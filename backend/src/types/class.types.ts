export interface ClassDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  teacherId: number;
  startDate: string | Date;
  endDate: string | Date;
  schedule: string;
  active: boolean;
  teacherName?: string;
}

export interface ClassCreationDto {
  name: string;
  code: string;
  description?: string;
  teacherId: number;
  startDate: string | Date;
  endDate: string | Date;
  schedule: string;
}

export interface ClassUpdateDto {
  name?: string;
  code?: string;
  description?: string;
  teacherId?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  schedule?: string;
  active?: boolean;
}