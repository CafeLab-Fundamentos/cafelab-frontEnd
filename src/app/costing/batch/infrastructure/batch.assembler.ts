import type { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import type { Batch } from '../domain/model/batch.entity';
import type { DirectCosts } from '../domain/model/direct-costs.entity';
import type { IndirectCosts } from '../domain/model/indirect-costs.entity';
import type { CostSummary } from '../domain/model/cost-summary.entity';
import type {
  CostSummaryResource,
  FinancialIndicators,
  FinancialIndicatorsResource,
} from '../domain/model/financial-indicators.entity';
import type { Recommendation } from '../domain/model/recommendation.entity';
import type {
  BatchListResponse,
  BatchResource,
  DirectCostsResource,
  IndirectCostsResource,
  RecommendationResource,
} from './batch.response';

/**
 * Mapeo resource ↔ entity para el agregado Batch y sus entidades hijas.
 * Sigue el mismo patrón que {@link LotPerformanceAssembler}.
 */
export class BatchAssembler
  implements BaseAssembler<Batch, BatchResource, BatchListResponse>
{
  // --------- Batch ---------
  toEntityFromResource(r: BatchResource): Batch {
    return {
      id: r.id,
      userId: Number(r.userId),
      batchName: r.batchName,
      registrationDate: r.registrationDate,
    };
  }

  toResourceFromEntity(e: Batch): BatchResource {
    return {
      id: e.id,
      userId: e.userId,
      batchName: e.batchName,
      registrationDate: e.registrationDate,
    };
  }

  toEntitiesFromResponse(_response: BatchListResponse): Batch[] {
    return [];
  }

  // --------- DirectCosts ---------
  directCostsFromResource(r: DirectCostsResource): DirectCosts {
    return {
      id: r.id,
      batchId: Number(r.batchId),
      coffeeLotId: Number(r.coffeeLotId),
      rawMaterialCost: Number(r.rawMaterialCost),
      coffeeQuantityKg: Number(r.coffeeQuantityKg),
      totalRawMaterial: Number(r.totalRawMaterial),
      hoursWorked: Number(r.hoursWorked),
      costPerHour: Number(r.costPerHour),
      numWorkers: Number(r.numWorkers),
      totalLaborCost: Number(r.totalLaborCost),
    };
  }

  // --------- IndirectCosts ---------
  indirectCostsFromResource(r: IndirectCostsResource): IndirectCosts {
    return {
      id: r.id,
      batchId: Number(r.batchId),
      transport: Number(r.transport),
      storageDays: Number(r.storageDays),
      dailyStorageCost: Number(r.dailyStorageCost),
      totalStorageCost: Number(r.totalStorageCost),
      electricity: Number(r.electricity),
      machineryMaintenance: Number(r.machineryMaintenance),
      processingSupplies: Number(r.processingSupplies),
      waterUsed: Number(r.waterUsed),
      equipmentDepreciation: Number(r.equipmentDepreciation),
      qualityControl: Number(r.qualityControl),
      certifications: Number(r.certifications),
      insurance: Number(r.insurance),
      adminExpenses: Number(r.adminExpenses),
    };
  }

  // --------- CostSummary ---------
  costSummaryFromResource(r: CostSummaryResource): CostSummary {
    return {
      id: r.id,
      batchId: Number(r.batchId),
      rawMaterial: Number(r.rawMaterial),
      directLabor: Number(r.directLabor),
      transport: Number(r.transport),
      storage: Number(r.storage),
      processing: Number(r.processing),
      otherCosts: Number(r.otherCosts),
      total: Number(r.total),
      costPerKg: Number(r.costPerKg),
      costPerCup: Number(r.costPerCup),
    };
  }

  // --------- FinancialIndicators ---------
  financialIndicatorsFromResource(r: FinancialIndicatorsResource): FinancialIndicators {
    return {
      id: r.id,
      batchId: Number(r.batchId),
      costPerKg: Number(r.costPerKg),
      potentialMargin: Number(r.potentialMargin),
      suggestedPrice: Number(r.suggestedPrice),
    };
  }

  // --------- Recommendation ---------
  recommendationFromResource(r: RecommendationResource): Recommendation {
    return {
      id: r.id,
      batchId: Number(r.batchId),
      recommendationText: r.recommendationText,
    };
  }
}
