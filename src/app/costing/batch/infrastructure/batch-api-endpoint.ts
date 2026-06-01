import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
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
import { BatchAssembler } from './batch.assembler';
import type {
  BatchListResponse,
  BatchResource,
  DirectCostsResource,
  IndirectCostsResource,
  RecommendationResource,
} from './batch.response';

/**
 * Endpoint HTTP del bounded context Costing (Batch + entidades hijas).
 * Cubre los 15 endpoints expuestos por {@code BatchesController} del backend.
 */
@Injectable({ providedIn: 'root' })
export class BatchApiEndpoint extends BaseApiEndpoint<
  Batch,
  BatchResource,
  BatchListResponse,
  BatchAssembler
> {
  private readonly batchAssembler: BatchAssembler;

  constructor(http: HttpClient) {
    const assembler = new BatchAssembler();
    super(http, `${environment.serverBaseUrl}${environment.batchesEndpointPath}`, assembler);
    this.batchAssembler = assembler;
  }

  // -------------------------- Batch CRUD ----------------------------------

  override getAll(): Observable<Batch[]> {
    return this.http.get<BatchResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) =>
        (Array.isArray(arr) ? arr : []).map((r) => this.batchAssembler.toEntityFromResource(r)),
      ),
      catchError(this.handleError('COSTING_BC.ERRORS.BATCHES_LOAD')),
    );
  }

  override getById(id: number): Observable<Batch> {
    return this.http.get<BatchResource>(`${this.endpointUrl}/${id}`, this.httpOptions).pipe(
      map((r) => this.batchAssembler.toEntityFromResource(r)),
      catchError(this.handleError('COSTING_BC.ERRORS.BATCH_DETAIL')),
    );
  }

  createBatch(body: CreateBatchRequest): Observable<Batch> {
    return this.http.post<BatchResource>(this.endpointUrl, body, this.httpOptions).pipe(
      map((r) => this.batchAssembler.toEntityFromResource(r)),
      catchError(this.handleError('COSTING_BC.ERRORS.BATCH_CREATE')),
    );
  }

  updateBatch(id: number, body: UpdateBatchRequest): Observable<Batch> {
    return this.http
      .put<BatchResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.batchAssembler.toEntityFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.BATCH_UPDATE')),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError('COSTING_BC.ERRORS.BATCH_DELETE')));
  }

  // -------------------------- DirectCosts ---------------------------------

  upsertDirectCosts(batchId: number, body: RegisterDirectCostsRequest): Observable<DirectCosts> {
    return this.http
      .put<DirectCostsResource>(
        `${this.endpointUrl}/${batchId}/direct-costs`,
        body,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.directCostsFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.DIRECT_COSTS_SAVE')),
      );
  }

  getDirectCosts(batchId: number): Observable<DirectCosts> {
    return this.http
      .get<DirectCostsResource>(
        `${this.endpointUrl}/${batchId}/direct-costs`,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.directCostsFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.DIRECT_COSTS_LOAD')),
      );
  }

  // -------------------------- IndirectCosts -------------------------------

  upsertIndirectCosts(
    batchId: number,
    body: RegisterIndirectCostsRequest,
  ): Observable<IndirectCosts> {
    return this.http
      .put<IndirectCostsResource>(
        `${this.endpointUrl}/${batchId}/indirect-costs`,
        body,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.indirectCostsFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.INDIRECT_COSTS_SAVE')),
      );
  }

  getIndirectCosts(batchId: number): Observable<IndirectCosts> {
    return this.http
      .get<IndirectCostsResource>(
        `${this.endpointUrl}/${batchId}/indirect-costs`,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.indirectCostsFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.INDIRECT_COSTS_LOAD')),
      );
  }

  // -------------------------- Compute -------------------------------------

  /** Calcula (o recalcula) CostSummary + FinancialIndicators en el backend. */
  compute(batchId: number, body: ComputeBatchCostingRequest): Observable<BatchCostingReport> {
    return this.http
      .post<BatchCostingReport>(
        `${this.endpointUrl}/${batchId}/compute`,
        body,
        this.httpOptions,
      )
      .pipe(catchError(this.handleError('COSTING_BC.ERRORS.COMPUTE')));
  }

  getCostSummary(batchId: number): Observable<CostSummary> {
    return this.http
      .get<CostSummary>(`${this.endpointUrl}/${batchId}/cost-summary`, this.httpOptions)
      .pipe(
        map((r) => this.batchAssembler.costSummaryFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.COST_SUMMARY_LOAD')),
      );
  }

  getFinancialIndicators(batchId: number): Observable<FinancialIndicators> {
    return this.http
      .get<FinancialIndicators>(
        `${this.endpointUrl}/${batchId}/financial-indicators`,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.financialIndicatorsFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.FINANCIAL_INDICATORS_LOAD')),
      );
  }

  // -------------------------- Recommendations ------------------------------

  addRecommendation(
    batchId: number,
    body: AddRecommendationRequest,
  ): Observable<Recommendation> {
    return this.http
      .post<RecommendationResource>(
        `${this.endpointUrl}/${batchId}/recommendations`,
        body,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.batchAssembler.recommendationFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.RECOMMENDATION_ADD')),
      );
  }

  listRecommendations(batchId: number): Observable<Recommendation[]> {
    return this.http
      .get<RecommendationResource[]>(
        `${this.endpointUrl}/${batchId}/recommendations`,
        this.httpOptions,
      )
      .pipe(
        map((arr) =>
          (Array.isArray(arr) ? arr : []).map((r) =>
            this.batchAssembler.recommendationFromResource(r),
          ),
        ),
        catchError(this.handleError('COSTING_BC.ERRORS.RECOMMENDATIONS_LOAD')),
      );
  }

  deleteRecommendation(batchId: number, recommendationId: number): Observable<void> {
    return this.http
      .delete<void>(
        `${this.endpointUrl}/${batchId}/recommendations/${recommendationId}`,
        this.httpOptions,
      )
      .pipe(catchError(this.handleError('COSTING_BC.ERRORS.RECOMMENDATION_DELETE')));
  }
}
