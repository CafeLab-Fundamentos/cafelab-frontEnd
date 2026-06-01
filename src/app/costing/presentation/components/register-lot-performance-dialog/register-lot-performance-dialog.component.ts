import { Component, Inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';

@Component({
  selector: 'app-register-lot-performance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    DecimalPipe
  ],
  template: `
    <h2 mat-dialog-title>{{ 'COSTING.REGISTER_TITLE' | translate }}</h2>

    <mat-dialog-content [formGroup]="form" style="min-width:360px; display:flex; flex-direction:column; gap:8px; padding-top:8px;">

      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING.LOT_LABEL' | translate }}</mat-label>
        <mat-select formControlName="coffeeLotId">
          @for (lot of data.lots; track lot.id) {
            <mat-option [value]="lot.id">
              {{ lot.lot_name }} — {{ lot.coffee_type }} · {{ lot.weight | number:'1.0-2' }} kg
            </mat-option>
          }
        </mat-select>
        @if (form.get('coffeeLotId')?.errors?.['required']) {
          <mat-error>{{ 'COSTING.ERRORS.LOT_REQUIRED' | translate }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING.INITIAL_WEIGHT_LABEL' | translate }}</mat-label>
        <input matInput type="number" formControlName="initialWeight" min="0.01" step="0.1" />
        <mat-hint>kg</mat-hint>
        @if (form.get('initialWeight')?.errors?.['required']) {
          <mat-error>{{ 'COSTING.ERRORS.INITIAL_REQUIRED' | translate }}</mat-error>
        }
        @if (form.get('initialWeight')?.errors?.['min']) {
          <mat-error>{{ 'COSTING.ERRORS.WEIGHT_MIN' | translate }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING.FINAL_WEIGHT_LABEL' | translate }}</mat-label>
        <input matInput type="number" formControlName="finalWeight" min="0.01" step="0.1" />
        <mat-hint>kg</mat-hint>
        @if (form.get('finalWeight')?.errors?.['required']) {
          <mat-error>{{ 'COSTING.ERRORS.FINAL_REQUIRED' | translate }}</mat-error>
        }
        @if (form.get('finalWeight')?.errors?.['min']) {
          <mat-error>{{ 'COSTING.ERRORS.WEIGHT_MIN' | translate }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING.PRODUCTION_TIME_LABEL' | translate }}</mat-label>
        <input matInput type="number" formControlName="productionTimeMinutes" min="1" step="1" />
        <mat-hint>{{ 'COSTING.MINUTES_HINT' | translate }}</mat-hint>
        @if (form.get('productionTimeMinutes')?.errors?.['required']) {
          <mat-error>{{ 'COSTING.ERRORS.TIME_REQUIRED' | translate }}</mat-error>
        }
        @if (form.get('productionTimeMinutes')?.errors?.['min']) {
          <mat-error>{{ 'COSTING.ERRORS.TIME_MIN' | translate }}</mat-error>
        }
      </mat-form-field>

      @if (apiError) {
        <div style="color:#c62828; font-size:0.9rem; padding:4px 0;">{{ apiError }}</div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="null">{{ 'COSTING.CANCEL' | translate }}</button>
      <button mat-raised-button color="primary" type="button"
              [disabled]="form.invalid"
              (click)="submit()"
              style="background:#414535; color:#fff;">
        {{ 'COSTING.REGISTER_BUTTON' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class RegisterLotPerformanceDialogComponent {
  form: FormGroup;
  apiError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegisterLotPerformanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { lots: CoffeeLot[] },
  ) {
    this.form = this.fb.group({
      coffeeLotId: ['', Validators.required],
      initialWeight: [null, [Validators.required, Validators.min(0.01)]],
      finalWeight: [null, [Validators.required, Validators.min(0.01)]],
      productionTimeMinutes: [null, [Validators.required, Validators.min(1)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const initial = Number(v.initialWeight);
    const final = Number(v.finalWeight);

    if (final > initial) {
      this.apiError = 'Final weight cannot exceed initial weight.';
      return;
    }

    this.dialogRef.close({
      coffeeLotId: Number(v.coffeeLotId),
      initialWeight: initial,
      finalWeight: final,
      productionTimeMinutes: Number(v.productionTimeMinutes),
    });
  }
}
