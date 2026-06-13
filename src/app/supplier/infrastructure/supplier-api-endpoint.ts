import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { Supplier } from '../domain/model/supplier.entity';
import { SupplierAssembler } from './supplier.assembler';
import type { SupplierListResponse, SupplierResource } from './supplier.response';

/**
 * Cliente HTTP del contexto Supplier (equivalente a {@code RelativesApiEndpoint} en MediTrack).
 */
@Injectable({
  providedIn: 'root',
})
export class SupplierApiEndpoint extends BaseApiEndpoint<
  Supplier,
  SupplierResource,
  SupplierListResponse,
  SupplierAssembler
> {
  private readonly supplierAssembler: SupplierAssembler;

  constructor(
    http: HttpClient,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {
    const assembler = new SupplierAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.suppliersEndpointPath}`,
      assembler,
    );
    this.supplierAssembler = assembler;
  }

  
  override getAll(): Observable<Supplier[]> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('SUPPLIER_BC.ERRORS.NOT_AUTHENTICATED_CREATE'),
          ),
      );
    }

    return this.http.get<SupplierResource[]>(
      `${this.endpointUrl}/user/${userId}`,
      this.httpOptions,
    ).pipe(
      map((arr) => this.mapCollection(arr)),
      catchError(this.handleError(this.translate.instant('SUPPLIER_BC.ERRORS.LOAD'))),
    );
  }

  override create(entity: Supplier): Observable<Supplier> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('SUPPLIER_BC.ERRORS.NOT_AUTHENTICATED_CREATE'),
          ),
      );
    }
    const body = this.supplierAssembler.toCreateResource({ ...entity, userId });
    return this.http
      .post<SupplierResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('SUPPLIER_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: Supplier, id: number): Observable<Supplier> {
    const body = this.supplierAssembler.toUpdateResource(entity);
    return this.http
      .put<SupplierResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('SUPPLIER_BC.ERRORS.UPDATE'))),
      );
  }

  private mapCollection(arr: SupplierResource[] | null | undefined): Supplier[] {
    return (Array.isArray(arr) ? arr : []).map((resource) =>
      this.assembler.toEntityFromResource(resource),
    );
  }
}
