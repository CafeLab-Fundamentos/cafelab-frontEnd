import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/infrastructure/AuthService';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import type { GrindCalibrationEntry } from '../domain/model/grind-calibration-entry.entity';
import { GrindCalibrationEntryAssembler } from './grind-calibration-entry.assembler';
import type {
  CreateGrindCalibrationBody,
  GrindCalibrationListResponse,
  GrindCalibrationResource,
  UpdateGrindCalibrationBody,
} from './grind-calibration-entry.response';

@Injectable({
  providedIn: 'root',
})
export class GrindCalibrationApiEndpoint extends BaseApiEndpoint<
  GrindCalibrationEntry,
  GrindCalibrationResource,
  GrindCalibrationListResponse,
  GrindCalibrationEntryAssembler
> {
  private readonly gcAssembler: GrindCalibrationEntryAssembler;

  constructor(
    http: HttpClient,
    private readonly translate: TranslateService,
    private readonly authService: AuthService,
  ) {
    const assembler = new GrindCalibrationEntryAssembler();
    super(
      http,
      `${environment.serverBaseUrl}${environment.calibrationsEndpointPath}`,
      assembler,
    );
    this.gcAssembler = assembler;
  }

  private requireUserId(errorKey: string): number | Observable<never> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      return throwError(() => new Error(this.translate.instant(errorKey)));
    }
    return userId;
  }

  private calibrationByUserUrl(userId: number, calibrationId: number): string {
    return `${this.endpointUrl}/user/${userId}/${calibrationId}`;
  }

  override getAll(): Observable<GrindCalibrationEntry[]> {
    const maybeUserId = this.requireUserId('GRIND_CALIBRATION_BC.ERRORS.LOAD');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http.get<GrindCalibrationResource[]>(`${this.endpointUrl}/user/${maybeUserId}`, this.httpOptions).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((r) => this.assembler.toEntityFromResource(r))),
      catchError(this.handleError(this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.LOAD'))),
    );
  }

  override getById(id: number): Observable<GrindCalibrationEntry> {
    const maybeUserId = this.requireUserId('GRIND_CALIBRATION_BC.ERRORS.DETAIL');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    return this.http
      .get<GrindCalibrationResource>(this.calibrationByUserUrl(maybeUserId, id), this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.DETAIL'))),
      );
  }

  override create(entity: GrindCalibrationEntry): Observable<GrindCalibrationEntry> {
    const maybeUserId = this.requireUserId('GRIND_CALIBRATION_BC.ERRORS.REGISTER');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: CreateGrindCalibrationBody = this.gcAssembler.toCreateBody({
      ...entity,
      userId: maybeUserId,
    });
    return this.http
      .post<GrindCalibrationResource>(this.endpointUrl, body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.REGISTER'))),
      );
  }

  override update(entity: GrindCalibrationEntry, id: number): Observable<GrindCalibrationEntry> {
    const maybeUserId = this.requireUserId('GRIND_CALIBRATION_BC.ERRORS.UPDATE');
    if (typeof maybeUserId !== 'number') {
      return maybeUserId;
    }

    const body: UpdateGrindCalibrationBody = this.gcAssembler.toUpdateBody(entity);
    return this.http
      .put<GrindCalibrationResource>(this.calibrationByUserUrl(maybeUserId, id), body, this.httpOptions)
      .pipe(
        map((r) => this.assembler.toEntityFromResource(r)),
        catchError(this.handleError(this.translate.instant('GRIND_CALIBRATION_BC.ERRORS.UPDATE'))),
      );
  }
}
