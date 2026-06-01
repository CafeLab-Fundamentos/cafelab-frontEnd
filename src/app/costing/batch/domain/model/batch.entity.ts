import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface Batch extends BaseEntity {
  userId: number;
  batchName: string;
  /** ISO date string (yyyy-MM-dd) — backend LocalDate */
  registrationDate: string;
}

export interface CreateBatchRequest {
  batchName: string;
  /** Opcional: si se omite el backend usa LocalDate.now() */
  registrationDate?: string;
}

export interface UpdateBatchRequest {
  batchName: string;
}
