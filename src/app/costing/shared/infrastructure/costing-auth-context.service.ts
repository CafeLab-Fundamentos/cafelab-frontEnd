import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { CoffeeLot } from '../../../coffee-lot/domain/model/coffee-lot.entity';
import { CoffeeLotAssembler } from '../../../coffee-lot/infrastructure/coffee-lot.assembler';
import type { CoffeeLotResource } from '../../../coffee-lot/infrastructure/coffee-lot.response';
import { TokenService } from '../../../auth/infrastructure/token.service';

@Injectable({ providedIn: 'root' })
export class CostingAuthContextService {
  private readonly coffeeLotAssembler = new CoffeeLotAssembler();

  constructor(
    private readonly tokenService: TokenService,
    private readonly http: HttpClient,
  ) {}

  getAuthenticatedUserId(): number | null {
    const claims = this.getTokenClaims();
    if (!claims) {
      return null;
    }

    for (const claimName of ['userId', 'user_id', 'profileId', 'profile_id', 'id']) {
      const parsed = this.toNumber(claims[claimName]);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  filterLotsForAuthenticatedUser(lots: CoffeeLot[]): CoffeeLot[] {
    const authenticatedUserId = this.getAuthenticatedUserId();
    if (authenticatedUserId === null) {
      return [];
    }

    return lots.filter((lot) => Number(lot.userId) === authenticatedUserId);
  }

  findOwnedLot(lots: CoffeeLot[], lotId: number): CoffeeLot | undefined {
    const authenticatedUserId = this.getAuthenticatedUserId();
    if (authenticatedUserId === null) {
      return undefined;
    }

    return lots.find(
      (lot) => Number(lot.id) === Number(lotId) && Number(lot.userId) === authenticatedUserId,
    );
  }

  loadOwnedLots(): Observable<CoffeeLot[]> {
    const authenticatedUserId = this.getAuthenticatedUserId();
    const endpoint = `${environment.serverBaseUrl}${environment.coffeeLotsEndpointPath}/user/${authenticatedUserId ?? 0}`;

    return this.http.get<CoffeeLotResource[]>(endpoint).pipe(
      map((resources) =>
        (Array.isArray(resources) ? resources : [])
          .map((resource) => this.coffeeLotAssembler.toEntityFromResource(resource)),
      ),
      map((lots) => this.filterLotsForAuthenticatedUser(lots)),
    );
  }

  private getTokenClaims(): Record<string, unknown> | null {
    const token = this.tokenService.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private toNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
