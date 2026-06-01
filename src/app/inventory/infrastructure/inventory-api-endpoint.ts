import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { AuthService } from '../../auth/infrastructure/AuthService';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import type { InventoryEntry } from '../domain/model/inventory-entry.entity';

import { InventoryEntryAssembler } from './inventory-entry.assembler';

import type {

  InventoryEntryListResponse,

  InventoryEntryResource,

} from './inventory-entry.response';



@Injectable({

  providedIn: 'root',

})

export class InventoryApiEndpoint extends BaseApiEndpoint<

  InventoryEntry,

  InventoryEntryResource,

  InventoryEntryListResponse,

  InventoryEntryAssembler

> {

  constructor(

    http: HttpClient,

    private readonly authService: AuthService,

    private readonly translate: TranslateService,

  ) {

    const assembler = new InventoryEntryAssembler();

    super(

      http,

      `${environment.serverBaseUrl}${environment.inventoryEndpointPath}`,

      assembler,

    );

  }

  override getAll(): Observable<InventoryEntry[]> {
    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      throw new Error(this.translate.instant('INVENTORY_BC.ERRORS.LOAD'));
    }

    return this.getByUserId(userId);
  }



  getByUserId(userId: number): Observable<InventoryEntry[]> {

    return this.http

      .get<InventoryEntryResource[]>(

        `${this.endpointUrl}/user/${userId}`,

        this.httpOptions,

      )

      .pipe(

        map((resources) =>

          resources.map((resource) => this.assembler.toEntityFromResource(resource)),

        ),

        catchError(this.handleError(this.translate.instant('INVENTORY_BC.ERRORS.LOAD'))),

      );

  }

}

