import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { LotPerformance } from '../domain/model/lot-performance.entity';
import { LotPerformanceAssembler } from './lot-performance.assembler';
import type {
  LotPerformanceListResponse,
  LotPerformanceResource,
  RegisterLotPerformanceBody,
} from './lot-performance.response';

@Injectable({
  providedIn: 'root',
})
export class LotPerformanceApiEndpoint extends BaseApiEndpoint<
  LotPerformance,
  LotPerformanceResource,
  LotPerformanceListResponse,
  LotPerformanceAssembler
> {
  private readonly lpAssembler: LotPerformanceAssembler;

  constructor(http: HttpClient, private readonly translate: TranslateService) {
    const assembler = new LotPerformanceAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.costingEndpointPath}`,
      assembler,
    );
    this.lpAssembler = assembler;
  }

  override getAll(): Observable<LotPerformance[]> {
    return this.http.get<LotPerformanceResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError('COSTING_BC.ERRORS.LOAD')),
    );
  }

  override getById(id: number): Observable<LotPerformance> {
    return this.http
      .get<LotPerformanceResource>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.DETAIL')),
      );
  }

  override create(entity: LotPerformance): Observable<LotPerformance> {
    const body: RegisterLotPerformanceBody = this.lpAssembler.toRegisterBody(entity);
    return this.http
      .post<LotPerformanceResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError('COSTING_BC.ERRORS.REGISTER')),
      );
  }
}
