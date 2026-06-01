import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { BrewPortfolioEntry } from '../domain/model/brew-portfolio-entry.entity';
import { BrewPortfolioEntryAssembler } from './brew-portfolio-entry.assembler';
import type {
  BrewPortfolioListResponse,
  BrewPortfolioResource,
  CreateBrewPortfolioBody,
  UpdateBrewPortfolioBody,
} from './brew-portfolio-entry.response';

@Injectable({
  providedIn: 'root',
})
export class BrewPortfolioApiEndpoint extends BaseApiEndpoint<
  BrewPortfolioEntry,
  BrewPortfolioResource,
  BrewPortfolioListResponse,
  BrewPortfolioEntryAssembler
> {
  private readonly bpAssembler: BrewPortfolioEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
  ) {
    const assembler = new BrewPortfolioEntryAssembler();
    super(http, `${environment.serverBaseUrl}${environment.portfoliosEndpointPath}`, assembler);
    this.bpAssembler = assembler;
  }

  private requireUserId(errorKey: string): number | Observable<never> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(() => new Error(this.translate.instant(errorKey)));
    }
    return userId;
  }

  private portfolioByUserUrl(userId: number, portfolioId: number): string {
    return `${this.endpointUrl}/user/${userId}/${portfolioId}`;
  }

  override getAll(): Observable<BrewPortfolioEntry[]> {
    const maybeUserId = this.requireUserId('PORTFOLIO_BC.ERRORS.LOAD');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<BrewPortfolioResource[]>(`${this.endpointUrl}/user/${maybeUserId}`, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('PORTFOLIO_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<BrewPortfolioEntry> {
    const maybeUserId = this.requireUserId('PORTFOLIO_BC.ERRORS.DETAIL');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<BrewPortfolioResource>(this.portfolioByUserUrl(maybeUserId, id), this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('PORTFOLIO_BC.ERRORS.DETAIL'))),
    );
  }

  override create(entity: BrewPortfolioEntry): Observable<BrewPortfolioEntry> {
    const maybeUserId = this.requireUserId('PORTFOLIO_BC.ERRORS.REGISTER');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: CreateBrewPortfolioBody = this.bpAssembler.toCreateBody({ ...entity, userId: maybeUserId });
    return this.http.post<BrewPortfolioResource>(this.endpointUrl, body, this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('PORTFOLIO_BC.ERRORS.REGISTER'))),
    );
  }

  override update(entity: BrewPortfolioEntry, id: number): Observable<BrewPortfolioEntry> {
    const maybeUserId = this.requireUserId('PORTFOLIO_BC.ERRORS.UPDATE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: UpdateBrewPortfolioBody = this.bpAssembler.toUpdateBody(entity);
    return this.http.put<BrewPortfolioResource>(this.portfolioByUserUrl(maybeUserId, id), body, this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('PORTFOLIO_BC.ERRORS.UPDATE'))),
    );
  }

  override delete(id: number): Observable<void> {
    const maybeUserId = this.requireUserId('PORTFOLIO_BC.ERRORS.DELETE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .delete<void>(this.portfolioByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('PORTFOLIO_BC.ERRORS.DELETE'))));
  }
}
