import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface CostSummary extends BaseEntity {
  batchId: number;
  rawMaterial: number;
  directLabor: number;
  transport: number;
  storage: number;
  processing: number;
  otherCosts: number;
  total: number;
  costPerKg: number;
  costPerCup: number;
}
