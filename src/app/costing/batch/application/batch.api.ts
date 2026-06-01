import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BatchApiEndpoint } from '../infrastructure/batch-api-endpoint';
import type { Batch, CreateBatchRequest, UpdateBatchRequest } from '../domain/model/batch.entity';
import type {
  DirectCosts,
  RegisterDirectCostsRequest,
} from '../domain/model/direct-costs.entity';
import type {
  IndirectCosts,
  RegisterIndirectCostsRequest,
} from '../domain/model/indirect-costs.entity';
import type { CostSummary } from '../domain/model/cost-summary.entity';
import type {
  BatchCostingReport,
  ComputeBatchCostingRequest,
  FinancialIndicators,
} from '../domain/model/financial-indicators.entity';
import type {
  AddRecommendationRequest,
  Recommendation,
} from '../domain/model/recommendation.entity';

/**
 * Facade del bounded context Costing (Batch). Las vistas consumen este servicio,
 * no el endpoint directamente.
 */
@Injectable({ providedIn: 'root' })
export class BatchApi {
  constructor(private readonly endpoint: BatchApiEndpoint) {}

  // Batch CRUD
  listMine(): Observable<Batch[]> {
    return this.endpoint.getAll();
  }

  getById(id: number): Observable<Batch> {
    return this.endpoint.getById(id);
  }

  create(body: CreateBatchRequest): Observable<Batch> {
    return this.endpoint.createBatch(body);
  }

  update(id: number, body: UpdateBatchRequest): Observable<Batch> {
    return this.endpoint.updateBatch(id, body);
  }

  delete(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }

  // DirectCosts / IndirectCosts (upsert)
  saveDirectCosts(batchId: number, body: RegisterDirectCostsRequest): Observable<DirectCosts> {
    return this.endpoint.upsertDirectCosts(batchId, body);
  }

  loadDirectCosts(batchId: number): Observable<DirectCosts> {
    return this.endpoint.getDirectCosts(batchId);
  }

  saveIndirectCosts(
    batchId: number,
    body: RegisterIndirectCostsRequest,
  ): Observable<IndirectCosts> {
    return this.endpoint.upsertIndirectCosts(batchId, body);
  }

  loadIndirectCosts(batchId: number): Observable<IndirectCosts> {
    return this.endpoint.getIndirectCosts(batchId);
  }

  // Compute & reads
  compute(batchId: number, body: ComputeBatchCostingRequest): Observable<BatchCostingReport> {
    return this.endpoint.compute(batchId, body);
  }

  loadCostSummary(batchId: number): Observable<CostSummary> {
    return this.endpoint.getCostSummary(batchId);
  }

  loadFinancialIndicators(batchId: number): Observable<FinancialIndicators> {
    return this.endpoint.getFinancialIndicators(batchId);
  }

  // Recommendations
  addRecommendation(
    batchId: number,
    body: AddRecommendationRequest,
  ): Observable<Recommendation> {
    return this.endpoint.addRecommendation(batchId, body);
  }

  listRecommendations(batchId: number): Observable<Recommendation[]> {
    return this.endpoint.listRecommendations(batchId);
  }

  deleteRecommendation(batchId: number, recommendationId: number): Observable<void> {
    return this.endpoint.deleteRecommendation(batchId, recommendationId);
  }
}
