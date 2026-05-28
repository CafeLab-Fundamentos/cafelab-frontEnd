import type { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-resource';

export interface BatchListResponse extends BaseResponse {}

export interface BatchResource extends BaseResource {
  userId: number;
  batchName: string;
  registrationDate: string;
}

export interface DirectCostsResource extends BaseResource {
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

export interface IndirectCostsResource extends BaseResource {
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

export interface RecommendationResource extends BaseResource {
  batchId: number;
  recommendationText: string;
}
