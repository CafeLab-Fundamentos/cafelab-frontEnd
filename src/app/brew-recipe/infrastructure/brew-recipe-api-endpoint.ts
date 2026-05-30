import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { BrewRecipeEntry } from '../domain/model/brew-recipe-entry.entity';
import { BrewRecipeEntryAssembler } from './brew-recipe-entry.assembler';
import type {
  BrewRecipeListResponse,
  BrewRecipeResource,
  CreateBrewRecipeBody,
  UpdateBrewRecipeBody,
} from './brew-recipe-entry.response';

@Injectable({
  providedIn: 'root',
})
export class BrewRecipeApiEndpoint extends BaseApiEndpoint<
  BrewRecipeEntry,
  BrewRecipeResource,
  BrewRecipeListResponse,
  BrewRecipeEntryAssembler
> {
  private readonly brAssembler: BrewRecipeEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
  ) {
    const assembler = new BrewRecipeEntryAssembler();
    super(http, `${environment.serverBaseUrl}${environment.recipesEndpointPath}`, assembler);
    this.brAssembler = assembler;
  }

  private requireUserId(errorKey: string): number | Observable<never> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(() => new Error(this.translate.instant(errorKey)));
    }
    return userId;
  }

  private recipeByUserUrl(userId: number, recipeId: number): string {
    return `${this.endpointUrl}/user/${userId}/${recipeId}`;
  }

  override getAll(): Observable<BrewRecipeEntry[]> {
    const maybeUserId = this.requireUserId('RECIPE_BC.ERRORS.LOAD');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<BrewRecipeResource[]>(`${this.endpointUrl}/user/${maybeUserId}`, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('RECIPE_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<BrewRecipeEntry> {
    const maybeUserId = this.requireUserId('RECIPE_BC.ERRORS.DETAIL');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<BrewRecipeResource>(this.recipeByUserUrl(maybeUserId, id), this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('RECIPE_BC.ERRORS.DETAIL'))),
    );
  }

  override create(entity: BrewRecipeEntry): Observable<BrewRecipeEntry> {
    const maybeUserId = this.requireUserId('RECIPE_BC.ERRORS.REGISTER');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: CreateBrewRecipeBody = this.brAssembler.toCreateBody({ ...entity, userId: maybeUserId });
    return this.http.post<BrewRecipeResource>(this.endpointUrl, body, this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('RECIPE_BC.ERRORS.REGISTER'))),
    );
  }

  override update(entity: BrewRecipeEntry, id: number): Observable<BrewRecipeEntry> {
    const maybeUserId = this.requireUserId('RECIPE_BC.ERRORS.UPDATE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: UpdateBrewRecipeBody = this.brAssembler.toUpdateBody(entity);
    return this.http.put<BrewRecipeResource>(this.recipeByUserUrl(maybeUserId, id), body, this.httpOptions).pipe(
      map((r) => this.assembler.toEntityFromResource(r)),
      catchError(this.handleError(this.translate.instant('RECIPE_BC.ERRORS.UPDATE'))),
    );
  }

  override delete(id: number): Observable<void> {
    const maybeUserId = this.requireUserId('RECIPE_BC.ERRORS.DELETE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .delete<void>(this.recipeByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(catchError(this.handleError(this.translate.instant('RECIPE_BC.ERRORS.DELETE'))));
  }
}
