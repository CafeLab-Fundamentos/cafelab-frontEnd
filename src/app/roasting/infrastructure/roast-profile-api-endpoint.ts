import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { RoastProfile } from '../domain/model/roast-profile.entity';
import { RoastProfileAssembler } from './roast-profile.assembler';
import type { RoastProfileListResponse, RoastProfileResource } from './roast-profile.response';

@Injectable({
  providedIn: 'root',
})
export class RoastProfileApiEndpoint extends BaseApiEndpoint<
  RoastProfile,
  RoastProfileResource,
  RoastProfileListResponse,
  RoastProfileAssembler
> {
  private readonly roastProfileAssembler: RoastProfileAssembler;

  constructor(
    http: HttpClient,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {
    const assembler = new RoastProfileAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.roastProfileEndpointPath}`,
      assembler,
    );
    this.roastProfileAssembler = assembler;
  }

  /**
   * Lista perfiles del usuario autenticado (JWT). Evita desajuste localStorage {@code user.id} vs id de perfil en token.
   */
  override getAll(): Observable<RoastProfile[]> {
    return this.http.get<RoastProfileResource[]>(this.endpointUrl, this.httpOptions).pipe(
      map((arr) =>
        arr.map((r) => this.assembler.toEntityFromResource(r)).map((p) => ({
          ...p,
          createdAt: p.createdAt
            ? new Date(String(p.createdAt))
            : p.createdAt,
        })),
      ),
      catchError(this.handleError(this.translate.instant('ROAST_PROFILE_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<RoastProfile> {
    return this.http.get<RoastProfileResource>(`${this.endpointUrl}/${id}`, this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('ROAST_PROFILE_BC.ERRORS.LOAD'))),
    );
  }

  override create(entity: RoastProfile): Observable<RoastProfile> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(
        () =>
          new Error(
            this.translate.instant('ROAST_PROFILE_BC.ERRORS.NOT_AUTHENTICATED_CREATE'),
          ),
      );
    }
    const body = this.roastProfileAssembler.toCreateResource({ ...entity, userId });
    return this.http
      .post<RoastProfileResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('ROAST_PROFILE_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: RoastProfile, id: number): Observable<RoastProfile> {
    const body = this.roastProfileAssembler.toUpdateResource(entity);
    return this.http
      .put<RoastProfileResource>(`${this.endpointUrl}/${id}`, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('ROAST_PROFILE_BC.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError(this.translate.instant('ROAST_PROFILE_BC.ERRORS.DELETE'))),
      );
  }
}
