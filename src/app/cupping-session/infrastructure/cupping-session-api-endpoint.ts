import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { CuppingSessionEntry } from '../domain/model/cupping-session-entry.entity';
import { CuppingSessionEntryAssembler } from './cupping-session-entry.assembler';
import type {
  CreateCuppingSessionBody,
  CuppingSessionListResponse,
  CuppingSessionResource,
  UpdateCuppingSessionBody,
} from './cupping-session-entry.response';

@Injectable({
  providedIn: 'root',
})
export class CuppingSessionApiEndpoint extends BaseApiEndpoint<
  CuppingSessionEntry,
  CuppingSessionResource,
  CuppingSessionListResponse,
  CuppingSessionEntryAssembler
> {
  private readonly csAssembler: CuppingSessionEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
  ) {
    const assembler = new CuppingSessionEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.cuppingSessionsEndpointPath}`,
      assembler,
    );
    this.csAssembler = assembler;
  }

  private requireUserId(errorKey: string): number | Observable<never> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(() => new Error(this.translate.instant(errorKey)));
    }
    return userId;
  }

  private sessionByUserUrl(userId: number, sessionId: number): string {
    return `${this.endpointUrl}/user/${userId}/${sessionId}`;
  }

  override getAll(): Observable<CuppingSessionEntry[]> {
    const maybeUserId = this.requireUserId('CUPPING_BC.ERRORS.LOAD');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<CuppingSessionResource[]>(`${this.endpointUrl}/${maybeUserId}`, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<CuppingSessionEntry> {
    const maybeUserId = this.requireUserId('CUPPING_BC.ERRORS.DETAIL');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .get<CuppingSessionResource>(this.sessionByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.DETAIL'))),
      );
  }

  override create(entity: CuppingSessionEntry): Observable<CuppingSessionEntry> {
    const maybeUserId = this.requireUserId('CUPPING_BC.ERRORS.REGISTER');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: CreateCuppingSessionBody = this.csAssembler.toCreateBody({
      ...entity,
      userId: maybeUserId,
    });
    return this.http
      .post<CuppingSessionResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: CuppingSessionEntry, id: number): Observable<CuppingSessionEntry> {
    const maybeUserId = this.requireUserId('CUPPING_BC.ERRORS.UPDATE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: UpdateCuppingSessionBody = this.csAssembler.toUpdateBody({
      ...entity,
      id,
      userId: maybeUserId,
    });
    return this.http
      .put<CuppingSessionResource>(this.sessionByUserUrl(maybeUserId, id), body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.UPDATE'))),
      );
  }

  override delete(id: number): Observable<void> {
    const maybeUserId = this.requireUserId('CUPPING_BC.ERRORS.DELETE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .delete<void>(this.sessionByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('CUPPING_BC.ERRORS.DELETE'))));
  }
}
