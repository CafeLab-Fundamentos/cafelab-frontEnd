import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { DefectLibraryEntry } from '../domain/model/defect-library-entry.entity';
import { DefectLibraryEntryAssembler } from './defect-library-entry.assembler';
import type {
  CreateDefectLibraryBody,
  DefectLibraryListResponse,
  DefectLibraryResource,
} from './defect-library-entry.response';

@Injectable({
  providedIn: 'root',
})
export class DefectLibraryApiEndpoint extends BaseApiEndpoint<
  DefectLibraryEntry,
  DefectLibraryResource,
  DefectLibraryListResponse,
  DefectLibraryEntryAssembler
> {
  private readonly defectAssembler: DefectLibraryEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
  ) {
    const assembler = new DefectLibraryEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.defectsEndpointPath}`,
      assembler,
    );
    this.defectAssembler = assembler;
  }

  private requireUserId(errorKey: string): number | Observable<never> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(() => new Error(this.translate.instant(errorKey)));
    }
    return userId;
  }

  private defectByUserUrl(userId: number, defectId: number): string {
    return `${this.endpointUrl}/user/${userId}/${defectId}`;
  }

  override getAll(): Observable<DefectLibraryEntry[]> {
    const maybeUserId = this.requireUserId('DEFECT_BC.ERRORS.LOAD');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<DefectLibraryResource[]>(`${this.endpointUrl}/user/${maybeUserId}`, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<DefectLibraryEntry> {
    const maybeUserId = this.requireUserId('DEFECT_BC.ERRORS.DETAIL');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .get<DefectLibraryResource>(this.defectByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.DETAIL'))),
      );
  }

  override create(entity: DefectLibraryEntry): Observable<DefectLibraryEntry> {
    const maybeUserId = this.requireUserId('DEFECT_BC.ERRORS.REGISTER');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: CreateDefectLibraryBody = this.defectAssembler.toCreateBody({
      ...entity,
      userId: maybeUserId,
    });
    return this.http
      .post<DefectLibraryResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('DEFECT_BC.ERRORS.REGISTER'))),
      );
  }
}
