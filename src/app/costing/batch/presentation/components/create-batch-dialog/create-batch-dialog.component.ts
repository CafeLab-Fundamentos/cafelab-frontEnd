import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-batch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    TranslateModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>{{ 'COSTING_BC.BATCH.CREATE_TITLE' | translate }}</h2>

    <mat-dialog-content [formGroup]="form" style="min-width:340px; display:flex; flex-direction:column; gap:8px; padding-top:8px;">
      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING_BC.BATCH.NAME' | translate }}</mat-label>
        <input matInput formControlName="batchName" maxlength="160" />
        @if (form.get('batchName')?.errors?.['required']) {
          <mat-error>{{ 'COSTING_BC.BATCH.NAME_REQUIRED' | translate }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'COSTING_BC.BATCH.REGISTRATION_DATE' | translate }}</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="registrationDate" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
        <mat-hint>{{ 'COSTING_BC.BATCH.DATE_HINT' | translate }}</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="null">{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-raised-button type="button"
              [disabled]="form.invalid"
              (click)="submit()"
              style="background:#414535;color:#fff;">
        {{ 'COSTING_BC.BATCH.CREATE_BUTTON' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateBatchDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateBatchDialogComponent>,
  ) {
    this.form = this.fb.group({
      batchName: ['', [Validators.required, Validators.maxLength(160)]],
      registrationDate: [new Date()],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const date: Date | null = v.registrationDate ? new Date(v.registrationDate) : null;
    this.dialogRef.close({
      batchName: String(v.batchName).trim(),
      registrationDate: date ? date.toISOString().slice(0, 10) : undefined,
    });
  }
}
