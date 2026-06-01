import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { CoffeeLot } from '../domain/model/coffee-lot.entity';
import { CoffeeLotAssembler } from './coffee-lot.assembler';
import type { CoffeeLotListResponse, CoffeeLotResource } from './coffee-lot.response';

@Injectable({
  providedIn: 'root',
})
export class CoffeeLotApiEndpoint extends BaseApiEndpoint<
  CoffeeLot,
  CoffeeLotResource,
  CoffeeLotListResponse,
  CoffeeLotAssembler
> {
  private readonly coffeeLotAssembler: CoffeeLotAssembler;

  constructor(
    http: HttpClient,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {
    const assembler = new CoffeeLotAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.coffeeLotsEndpointPath}`,
      assembler,
    );
    this.coffeeLotAssembler = assembler;
  }

  /**
   * Lista lotes del usuario autenticado usando la ruta segmentada por usuario.
   */
  override getAll(): Observable<CoffeeLot[]> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD'),
          ),
      );
    }

    return this.http.get<CoffeeLotResource[]>(`${this.endpointUrl}/user/${userId}`, this.httpOptions).pipe(
      map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD'))),
    );
  }

  getAvailable(): Observable<CoffeeLot[]> {
    return this.http
      .get<CoffeeLotResource[]>(`${this.endpointUrl}/available`, this.httpOptions)
      .pipe(
        map((arr) => arr.map((r) => this.assembler.toEntityFromResource(r))),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.LOAD'))),
      );
  }

  consumeStock(
    lotId: number,
    quantityKg: number,
    options?: { finalProduct?: string; dateUsed?: string },
  ): Observable<CoffeeLot> {
    const body: Record<string, unknown> = { weight: quantityKg };
    if (options?.finalProduct?.trim()) {
      body['finalProduct'] = options.finalProduct.trim();
    }
    if (options?.dateUsed) {
      body['dateUsed'] = options.dateUsed;
    }
    return this.http
      .patch<CoffeeLotResource>(
        `${this.endpointUrl}/${lotId}/consume-stock`,
        body,
        this.httpOptions,
      )
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.REGISTER'))),
      );
  }


  override create(entity: CoffeeLot): Observable<CoffeeLot> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('COFFEE_LOT_BC.ERRORS.NOT_AUTHENTICATED_CREATE'),
          ),
      );
    }
    const body = this.coffeeLotAssembler.toCreateResource(entity);
    return this.http
      .post<CoffeeLotResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: CoffeeLot, id: number): Observable<CoffeeLot> {
    const body = this.coffeeLotAssembler.toUpdateResource(entity);
    return this.http
      .put<CoffeeLotResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('COFFEE_LOT_BC.ERRORS.UPDATE'))),
      );
  }
}
