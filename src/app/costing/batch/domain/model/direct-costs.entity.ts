import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface DirectCosts extends BaseEntity {
  batchId: number;
  coffeeLotId: number;
  rawMaterialCost: number;
  coffeeQuantityKg: number;
  totalRawMaterial: number;
  hoursWorked: number;
  costPerHour: number;
  numWorkers: number;
  totalLaborCost: number;
}

export interface RegisterDirectCostsRequest {
  coffeeLotId: number;
  rawMaterialCost: number;
  coffeeQuantityKg: number;
  hoursWorked: number;
  costPerHour: number;
  numWorkers: number;
}
