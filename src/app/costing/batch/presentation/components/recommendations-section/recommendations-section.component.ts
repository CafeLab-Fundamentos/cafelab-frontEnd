import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { BatchApi } from '../../../application/batch.api';
import type { Recommendation } from '../../../domain/model/recommendation.entity';

/**
 * Lista y CRUD básico de recomendaciones de un Batch.
 * Recibe {@code batchId} por @Input para mantenerse sin estado de routing.
 */
@Component({
  selector: 'app-recommendations-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  template: `
    <mat-card style="margin:16px 0;">
      <mat-card-header>
        <mat-card-title>{{ 'COSTING_BC.RECOMMENDATIONS.TITLE' | translate }}</mat-card-title>
        <mat-card-subtitle>{{ 'COSTING_BC.RECOMMENDATIONS.SUBTITLE' | translate }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content [formGroup]="form" style="display:flex; gap:12px; align-items:flex-start; padding-top:12px;">
        <mat-form-field appearance="outline" style="flex:1;">
          <mat-label>{{ 'COSTING_BC.RECOMMENDATIONS.TEXT' | translate }}</mat-label>
          <textarea matInput formControlName="recommendationText" rows="2" maxlength="2000"
                    placeholder="{{ 'COSTING_BC.RECOMMENDATIONS.PLACEHOLDER' | translate }}"></textarea>
          @if (form.get('recommendationText')?.errors?.['required']) {
            <mat-error>{{ 'COSTING_BC.RECOMMENDATIONS.REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>
        <button mat-raised-button type="button"
                [disabled]="form.invalid || adding"
                (click)="add()"
                style="background:#414535;color:#fff;margin-top:8px;">
          <mat-icon>add</mat-icon>
          {{ 'COSTING_BC.RECOMMENDATIONS.ADD' | translate }}
        </button>
      </mat-card-content>
    </mat-card>

    <div *ngIf="loading" style="text-align:center;padding:20px;color:#666;">
      {{ 'COMMON.LOADING' | translate }}
    </div>

    <div *ngIf="!loading && items.length === 0" style="text-align:center;padding:32px;color:#666;">
      {{ 'COSTING_BC.RECOMMENDATIONS.NO_DATA' | translate }}
    </div>

    @for (item of items; track item.id) {
      <mat-card style="margin:8px 0;border-left:4px solid #4A5A54;">
        <mat-card-content style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding-top:16px;">
          <div style="flex:1;color:#414535;line-height:1.5;">{{ item.recommendationText }}</div>
          <button mat-icon-button (click)="remove(item)" [disabled]="deletingId === item.id">
            <mat-icon style="color:#c62828;">delete</mat-icon>
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
})
export class RecommendationsSectionComponent implements OnInit, OnChanges {
  @Input() batchId = 0;

  items: Recommendation[] = [];
  loading = false;
  adding = false;
  deletingId: number | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private batchApi: BatchApi,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({
      recommendationText: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  ngOnInit(): void {
    if (this.batchId) this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['batchId'] && this.batchId) {
      this.reload();
    }
  }

  reload(): void {
    this.loading = true;
    this.batchApi
      .listRecommendations(this.batchId)
      .pipe(
        catchError((err) => {
          this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
          return of([] as Recommendation[]);
        }),
      )
      .subscribe((list) => {
        this.items = list;
        this.loading = false;
      });
  }

  add(): void {
    if (this.form.invalid) return;
    const text = String(this.form.value.recommendationText).trim();
    if (!text) return;
    this.adding = true;
    this.batchApi
      .addRecommendation(this.batchId, { recommendationText: text })
      .pipe(
        catchError((err) => {
          this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
          return of(null as Recommendation | null);
        }),
      )
      .subscribe((created) => {
        this.adding = false;
        if (created) {
          this.items = [created, ...this.items];
          this.form.reset({ recommendationText: '' });
          this.snackBar.open(
            this.translate.instant('COSTING_BC.RECOMMENDATIONS.ADDED'),
            undefined,
            { duration: 2500 },
          );
        }
      });
  }

  remove(item: Recommendation): void {
    if (!window.confirm(this.translate.instant('COSTING_BC.RECOMMENDATIONS.DELETE_CONFIRM'))) return;
    this.deletingId = item.id;
    this.batchApi
      .deleteRecommendation(this.batchId, item.id)
      .pipe(
        catchError((err) => {
          this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
          return of(null);
        }),
      )
      .subscribe(() => {
        this.deletingId = null;
        this.items = this.items.filter((r) => r.id !== item.id);
        this.snackBar.open(
          this.translate.instant('COSTING_BC.RECOMMENDATIONS.DELETED'),
          undefined,
          { duration: 2500 },
        );
      });
  }
}
