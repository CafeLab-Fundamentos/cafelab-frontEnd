import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface IndirectCosts extends BaseEntity {
  batchId: number;
  transport: number;
  storageDays: number;
  dailyStorageCost: number;
  totalStorageCost: number;
  electricity: number;
  machineryMaintenance: number;
  processingSupplies: number;
  waterUsed: number;
  equipmentDepreciation: number;
  qualityControl: number;
  certifications: number;
  insurance: number;
  adminExpenses: number;
}

export interface RegisterIndirectCostsRequest {
  transport: number;
  storageDays: number;
  dailyStorageCost: number;
  electricity: number;
  machineryMaintenance: number;
  processingSupplies: number;
  waterUsed: number;
  equipmentDepreciation: number;
  qualityControl: number;
  certifications: number;
  insurance: number;
  adminExpenses: number;
}
