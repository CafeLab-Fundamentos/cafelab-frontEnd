import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SupplierApi } from '../../../application/supplier.api';
import { Supplier } from '../../../domain/model/supplier.entity';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { getUserFacingApiMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../auth/infrastructure/AuthService';

@Component({
  selector: 'app-Supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
  @ViewChild('supplierForm') supplierForm!: NgForm;
  @ViewChild('editForm') editForm!: NgForm;
  readonly supplierStatuses = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;

  suppliers: Supplier[] = [];
  searchQuery: string = '';
  showRegisterModal: boolean = false;
  showEditModal: boolean = false;
  showSupplierDetails: boolean = false;

  newSpecialties: string[] = [];
  editingSpecialties: string[] = [];

  newSupplier: Supplier = this.getEmptySupplier();

  editingSupplier: Supplier = this.getEmptySupplier();

  selectedSupplier: Supplier | null = null;
  loading: boolean = false;
  error: string | null = null;

  
  registerFieldErrors: Partial<Record<string, string>> = {};
  
  editFieldErrors: Partial<Record<string, string>> = {};

  constructor(
    private readonly supplierApi: SupplierApi,
    private readonly translateService: TranslateService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.error = null;

    this.supplierApi.getAll()
      .pipe(
        catchError(err => {
          console.error('Error loading suppliers', err);
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.LOAD');
          return of([]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  searchSuppliers(): void {
    if (this.searchQuery.trim()) {
      this.loading = true;
      this.error = null;

      this.supplierApi.searchSuppliers(this.searchQuery)
        .pipe(
          catchError(err => {
            console.error('Error searching suppliers', err);
            this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.SEARCH');
            return of([]);
          }),
          finalize(() => this.loading = false)
        )
        .subscribe((suppliers: Supplier[]) => (this.suppliers = suppliers));
    } else {
      this.loadSuppliers();
    }
  }

  viewSupplierDetails(supplier: Supplier): void {
    this.selectedSupplier = { ...supplier };
    this.showSupplierDetails = true;
    this.error = null;
  }

  closeSupplierDetails(): void {
    this.showSupplierDetails = false;
    this.selectedSupplier = null;
    this.error = null;
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplier = { ...supplier };
    this.editingSpecialties = [...supplier.specialties];
    this.showEditModal = true;
    this.showSupplierDetails = false;
    this.error = null;
    this.editFieldErrors = {};
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.error = null;
    this.editFieldErrors = {};
    this.editingSpecialties = [];
    if (this.editForm) {
      this.editForm.resetForm();
    }
  }

  openRegisterModal(): void {
    this.error = null;
    this.registerFieldErrors = {};
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
    this.error = null;
    this.registerFieldErrors = {};
  }

  saveSupplierChanges(): void {
    this.editFieldErrors = {};
    this.error = null;

    if (!this.editingSupplier.id || this.editingSupplier.id <= 0) {
      this.error = this.translateService.instant('SUPPLIER_BC.ERRORS.NOT_FOUND');
      return;
    }

    if (!this.validateSupplierFields(this.editingSupplier, 'edit')) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
      return;
    }

    this.loading = true;
    this.error = null;
    this.editingSupplier = this.normalizeSupplierForSubmit(
      this.editingSupplier,
      this.editingSpecialties,
    );

    this.supplierApi.update(this.editingSupplier.id, this.editingSupplier)
      .pipe(
        catchError((err) => {
          console.error('Error updating supplier', err);
          if (
            err instanceof HttpErrorResponse &&
            this.applySupplierApiValidationErrors(err, 'edit')
          ) {
            return of(null);
          }
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.UPDATE');
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result !== null) {
          this.showEditModal = false;
          this.loadSuppliers();
        }
      });
  }
  deleteSupplier(id: number): void {
    if (!confirm(this.translateService.instant('SUPPLIER_BC.CONFIRM_DELETE'))) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.supplierApi.delete(id)
      .pipe(
        catchError(err => {
          console.error('Error deleting supplier', err);
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.DELETE');
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result !== null) {
          this.loadSuppliers();
        }
      });
  }

  registerSupplier(): void {
    this.registerFieldErrors = {};
    this.error = null;

    if (!this.validateSupplierFields(this.newSupplier, 'register')) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
      return;
    }

    const userId = Number(this.authService.getCurrentUserId());
    if (!userId || Number.isNaN(userId)) {
      this.error = this.translateService.instant(
        'SUPPLIER_BC.ERRORS.NOT_AUTHENTICATED_CREATE',
      );
      return;
    }

    this.loading = true;
    this.error = null;
    this.newSupplier = this.normalizeSupplierForSubmit(
      { ...this.newSupplier, userId },
      this.newSpecialties,
    );

    this.supplierApi.create(this.newSupplier)
      .pipe(
        catchError((err) => {
          console.error('Error adding supplier', err);
          if (
            err instanceof HttpErrorResponse &&
            this.applySupplierApiValidationErrors(err, 'register')
          ) {
            return of(null);
          }
          this.error = this.supplierErrorMessage(err, 'SUPPLIER_BC.ERRORS.REGISTER');
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((result: any) => {
        if (result !== null) {
          this.showRegisterModal = false;
          this.resetForm();
          this.loadSuppliers();
        }
      });
  }

  addNewSpecialty(specialtyInput: HTMLInputElement): void {
    const specialty = specialtyInput.value.trim();
    delete this.registerFieldErrors['specialties'];
    if (specialty && this.newSpecialties.length < 4 && !this.newSpecialties.includes(specialty)) {
      this.newSpecialties.push(specialty);
      specialtyInput.value = '';
    } else if (this.newSpecialties.length >= 4) {
      this.registerFieldErrors['specialties'] = this.translateService.instant(
        'SUPPLIER_BC.VALIDATION.SPECIALTIES_MAX',
      );
    } else if (this.newSpecialties.includes(specialty)) {
      this.registerFieldErrors['specialties'] = this.translateService.instant(
        'SUPPLIER_BC.VALIDATION.SPECIALTY_DUPLICATE',
      );
    }
  }

  removeNewSpecialty(index: number): void {
    this.newSpecialties.splice(index, 1);
  }

  addEditSpecialty(specialtyInput: HTMLInputElement): void {
    const specialty = specialtyInput.value.trim();
    delete this.editFieldErrors['specialties'];
    if (specialty && this.editingSpecialties.length < 4 && !this.editingSpecialties.includes(specialty)) {
      this.editingSpecialties.push(specialty);
      specialtyInput.value = '';
    } else if (this.editingSpecialties.length >= 4) {
      this.editFieldErrors['specialties'] = this.translateService.instant(
        'SUPPLIER_BC.VALIDATION.SPECIALTIES_MAX',
      );
    } else if (this.editingSpecialties.includes(specialty)) {
      this.editFieldErrors['specialties'] = this.translateService.instant(
        'SUPPLIER_BC.VALIDATION.SPECIALTY_DUPLICATE',
      );
    }
  }

  removeEditSpecialty(index: number): void {
    this.editingSpecialties.splice(index, 1);
  }

  resetForm(): void {
    this.newSupplier = this.getEmptySupplier();

    this.newSpecialties = [];
    this.registerFieldErrors = {};

    if (this.supplierForm) {
      this.supplierForm.resetForm();
    }

    this.error = null;
  }

  clearRegisterFieldError(field: string): void {
    delete this.registerFieldErrors[field];
  }

  clearEditFieldError(field: string): void {
    delete this.editFieldErrors[field];
  }

  getStatusText(status: string): string {
    const normalizedStatus = String(status ?? '').trim().toUpperCase();
    const labels = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };
    return labels[normalizedStatus as keyof typeof labels] ?? normalizedStatus;
  }

  private getEmptySupplier(): Supplier {
    return {
      id: 0,
      name: '',
      email: '',
      phone: '',
      location: '',
      status: '' as Supplier['status'],
      specialties: [],
      userId: 0,
    };
  }

  private normalizeSupplierForSubmit(model: Supplier, specialties: string[]): Supplier {
    return {
      ...model,
      name: String(model.name ?? '').trim(),
      email: String(model.email ?? '').trim().toLowerCase(),
      phone: this.normalizePhone(model.phone),
      location: String(model.location ?? '').trim(),
      status: String(model.status ?? '').trim().toUpperCase() as Supplier['status'],
      specialties: specialties
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    };
  }

  private normalizePhone(raw: unknown): string {
    return String(raw ?? '').trim();
  }

  private emailLooksValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validación en cliente con mensaje por campo.
   * @returns true si todo es válido.
   */
  private validateSupplierFields(
    model: Supplier,
    mode: 'register' | 'edit',
  ): boolean {
    const target = mode === 'register' ? this.registerFieldErrors : this.editFieldErrors;
    (['name', 'email', 'phone', 'location', 'status'] as const).forEach((k) => delete target[k]);
    delete target['specialties'];

    let ok = true;
    const t = (k: string) => this.translateService.instant(k);

    const name = (model.name ?? '').trim();
    if (!name) {
      target['name'] = t('SUPPLIER_BC.VALIDATION.NAME_REQUIRED');
      ok = false;
    }

    const email = (model.email ?? '').trim();
    if (!email) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_REQUIRED');
      ok = false;
    } else if (!this.emailLooksValid(email)) {
      target['email'] = t('SUPPLIER_BC.VALIDATION.EMAIL_INVALID');
      ok = false;
    }

    const phone = this.normalizePhone(model.phone);
    if (!phone) {
      target['phone'] = t('SUPPLIER_BC.VALIDATION.PHONE_REQUIRED');
      ok = false;
    }

    const location = (model.location ?? '').trim();
    if (!location) {
      target['location'] = t('SUPPLIER_BC.VALIDATION.LOCATION_REQUIRED');
      ok = false;
    }

    const status = String(model.status ?? '').trim().toUpperCase();
    if (!status) {
      target['status'] = this.invalidStatusMessage();
      ok = false;
    } else if (!this.supplierStatuses.includes(status as (typeof this.supplierStatuses)[number])) {
      target['status'] = this.invalidStatusMessage();
      ok = false;
    }

    return ok;
  }

  /**
   * Mapea cuerpo 400 con {@code errors: [{ field, message }]} del backend.
   * @returns true si se interpretó como validación por campo.
   */
  private applySupplierApiValidationErrors(
    err: HttpErrorResponse,
    mode: 'register' | 'edit',
  ): boolean {
    if (err.status !== 400) {
      return false;
    }
    const body = err.error;
    if (!body || typeof body !== 'object') {
      return false;
    }
    const rawErrors = (body as { errors?: unknown }).errors;
    if (!Array.isArray(rawErrors) || rawErrors.length === 0) {
      return false;
    }

    if (mode === 'register') {
      this.registerFieldErrors = {};
    } else {
      this.editFieldErrors = {};
    }
    const target =
      mode === 'register' ? this.registerFieldErrors : this.editFieldErrors;

    const unmapped: string[] = [];
    for (const item of rawErrors) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const row = item as {
        field?: string;
        message?: string;
        defaultMessage?: string;
      };
      const text = (row.message || row.defaultMessage || '').trim();
      if (!text) {
        continue;
      }
      const key = this.normalizeSupplierApiField(row.field || '');
      if (key === 'userId') {
        unmapped.push(text);
      } else if (key) {
        const prev = target[key];
        target[key] = prev ? `${prev} · ${text}` : text;
      } else {
        unmapped.push(text);
      }
    }

    const hasFieldErrors = Object.keys(target).length > 0;
    if (unmapped.length > 0) {
      this.error = unmapped.join(' | ');
    } else if (hasFieldErrors) {
      this.error = this.translateService.instant('SUPPLIER_BC.VALIDATION.SUMMARY');
    } else {
      this.error = null;
    }
    return true;
  }

  private normalizeSupplierApiField(field: string): string | null {
    if (!field) {
      return null;
    }
    const leaf = field.replace(/\[\d+\]/g, '').split('.').pop() || field;
    const allowed = new Set([
      'name',
      'email',
      'phone',
      'location',
      'status',
      'specialties',
      'specialities',
      'userId',
    ]);
    if (!allowed.has(leaf)) {
      return null;
    }
    return leaf === 'specialities' ? 'specialties' : leaf;
  }

  private invalidStatusMessage(): string {
    return 'Seleccione un estado del proveedor.';
  }

  private supplierErrorMessage(err: unknown, i18nKey: string): string {
    const fallback = this.translateService.instant(i18nKey);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.NETWORK');
      }
      if (err.status === 401 || err.status === 403) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.UNAUTHORIZED');
      }
      const fromBody = getUserFacingApiMessage(err, '');
      if (fromBody) {
        return fromBody;
      }
      if (err.status === 404) {
        return this.translateService.instant('SUPPLIER_BC.ERRORS.NOT_FOUND');
      }
    }
    const fromApi = getUserFacingApiMessage(err, '');
    if (fromApi) {
      return fromApi;
    }
    return fallback || this.translateService.instant('SUPPLIER_BC.ERRORS.GENERIC');
  }
}
