import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  EnvironmentThreshold,
  EnvironmentThresholdFormValues,
} from '../domain/model/environment-threshold.entity';
import { EnvironmentThresholdAssembler } from './environment-threshold.assembler';
import type { EnvironmentThresholdResource } from './environment-threshold.response';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentThresholdApiEndpoint {
  private readonly baseUrl = `${environment.serverBaseUrl}${environment.environmentThresholdsEndpointPath}`;
  private readonly assembler = new EnvironmentThresholdAssembler();

  constructor(private readonly http: HttpClient) {}

  getByCoffeeLotId(coffeeLotId: number): Observable<EnvironmentThreshold | null> {
    return this.http
      .get<EnvironmentThresholdResource>(
        `${this.baseUrl}/coffee-lot/${coffeeLotId}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  create(
    coffeeLotId: number,
    values: EnvironmentThresholdFormValues,
  ): Observable<EnvironmentThreshold> {
    const body = this.assembler.toCreateBody(coffeeLotId, values);
    return this.http
      .post<EnvironmentThresholdResource>(this.baseUrl, body)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  update(
    coffeeLotId: number,
    values: EnvironmentThresholdFormValues,
  ): Observable<EnvironmentThreshold> {
    const body = this.assembler.toCreateBody(coffeeLotId, values);
    return this.http
      .put<EnvironmentThresholdResource>(
        `${this.baseUrl}/coffee-lot/${coffeeLotId}`,
        body,
      )
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
