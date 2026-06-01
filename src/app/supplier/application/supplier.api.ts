import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SupplierApiEndpoint } from '../infrastructure/supplier-api-endpoint';
import type { Supplier } from '../domain/model/supplier.entity';

/**
 * Fachada del bounded context Supplier (equivalente a {@code RelativesApi} en MediTrack).
 * La presentación solo depende de esta clase, no del {@link SupplierApiEndpoint}.
 */
@Injectable({
  providedIn: 'root',
})
export class SupplierApi {
  constructor(private readonly supplierApiEndpoint: SupplierApiEndpoint) {}

  getAll(): Observable<Supplier[]> {
    return this.supplierApiEndpoint.getAll();
  }

  getById(id: number): Observable<Supplier> {
    return this.supplierApiEndpoint.getById(id);
  }

  searchSuppliers(query: string): Observable<Supplier[]> {
    const q = query.trim().toLowerCase();
    return this.getAll().pipe(
      map((rows) =>
        !q
          ? rows
          : rows.filter(
              (s) =>
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                String(s.phone ?? '').includes(q) ||
                s.location.toLowerCase().includes(q),
            ),
      ),
    );
  }

  create(entity: Supplier): Observable<Supplier> {
    return this.supplierApiEndpoint.create(entity);
  }

  update(id: number, entity: Supplier): Observable<Supplier> {
    return this.supplierApiEndpoint.update(entity, id);
  }

  delete(id: number): Observable<void> {
    return this.supplierApiEndpoint.delete(id);
  }
}
