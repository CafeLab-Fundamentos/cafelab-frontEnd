import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface FinancialIndicators extends BaseEntity {
  batchId: number;
  costPerKg: number;
  potentialMargin: number;
  suggestedPrice: number;
}

export interface ComputeBatchCostingRequest {
  gramsPerCup: number;
  targetMarginPercentage: number;
}

export interface BatchCostingReport {
  costSummary: CostSummaryResource;
  financialIndicators: FinancialIndicatorsResource;
}

/** Forma cruda que devuelve el backend (para mapear desde HTTP). */
export interface CostSummaryResource {
  id: number;
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

export interface FinancialIndicatorsResource {
  id: number;
  batchId: number;
  costPerKg: number;
  potentialMargin: number;
  suggestedPrice: number;
}
