import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { ToolbarComponent } from '../../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../../auth/infrastructure/AuthService';
import { CoffeeLotApi } from '../../../../../coffee-lot/application/coffee-lot.api';
import type { CoffeeLot } from '../../../../../coffee-lot/domain/model/coffee-lot.entity';
import { BatchApi } from '../../../application/batch.api';
import type { Batch } from '../../../domain/model/batch.entity';
import type { DirectCosts } from '../../../domain/model/direct-costs.entity';
import type { IndirectCosts } from '../../../domain/model/indirect-costs.entity';
import type { CostSummary } from '../../../domain/model/cost-summary.entity';
import type { FinancialIndicators } from '../../../domain/model/financial-indicators.entity';
import { RecommendationsSectionComponent } from '../../components/recommendations-section/recommendations-section.component';

/**
 * Página de detalle de un Batch. Muestra y permite editar costos directos,
 * indirectos, recalcula CostSummary + FinancialIndicators, y administra
 * recomendaciones (sub-componente).
 */
@Component({
  selector: 'app-batch-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatToolbar,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatSelectModule,
    TranslateModule,
    ToolbarComponent,
    RecommendationsSectionComponent,
  ],
  template: `
    <mat-toolbar color="primary"><app-toolbar /></mat-toolbar>

    <nav style="display:flex;align-items:center;gap:6px;font-size:15px;margin:18px 0 10px 20px;color:#4A5A54;">
      <a (click)="goToHome()" style="color:#4A5A54;text-decoration:underline;cursor:pointer;font-weight:500;">{{ 'BREADCRUMB.HOME' | translate }}</a>
      <span>&gt;</span>
      <a (click)="goBack()" style="color:#4A5A54;text-decoration:underline;cursor:pointer;font-weight:500;">{{ 'COSTING_BC.BATCH.PAGE_TITLE' | translate }}</a>
      <span>&gt;</span>
      <span style="font-weight:600;color:#414535;">{{ batch?.batchName || ('COMMON.LOADING' | translate) }}</span>
    </nav>

    <div style="padding:20px;background:#f4f2ed;min-height:100vh;">
      <div *ngIf="error" style="background:#ffebee;color:#c62828;padding:12px;border-radius:4px;margin-bottom:16px;border-left:4px solid #c62828;">{{ error }}</div>

      <mat-card style="margin-bottom:16px;">
        <mat-card-header>
          <mat-card-title>{{ batch?.batchName }}</mat-card-title>
          <mat-card-subtitle>
            ID #{{ batch?.id }} · {{ batch?.registrationDate | date:'mediumDate' }}
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-tab-group dynamicHeight>

        <!-- DIRECT COSTS -->
        <mat-tab label="{{ 'COSTING_BC.DIRECT_COSTS.TAB' | translate }}">
          <mat-card style="margin:16px 0;">
            <mat-card-content [formGroup]="directForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:12px;">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.COFFEE_LOT' | translate }}</mat-label>
                <mat-select formControlName="coffeeLotId">
                  @for (lot of lots; track lot.id) {
                    <mat-option [value]="lot.id">{{ lot.lot_name }} — {{ lot.coffee_type }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.RAW_MATERIAL_COST' | translate }}</mat-label>
                <input matInput type="number" formControlName="rawMaterialCost" min="0" step="0.01" />
                <mat-hint>S/. / kg</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.QUANTITY_KG' | translate }}</mat-label>
                <input matInput type="number" formControlName="coffeeQuantityKg" min="0.01" step="0.01" />
                <mat-hint>kg</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.HOURS_WORKED' | translate }}</mat-label>
                <input matInput type="number" formControlName="hoursWorked" min="0" step="1" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.COST_PER_HOUR' | translate }}</mat-label>
                <input matInput type="number" formControlName="costPerHour" min="0" step="0.01" />
                <mat-hint>S/. / h</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.DIRECT_COSTS.NUM_WORKERS' | translate }}</mat-label>
                <input matInput type="number" formControlName="numWorkers" min="0" step="1" />
              </mat-form-field>
              <div *ngIf="directCosts" style="grid-column:1 / span 2;padding:12px;background:#f8f7f2;border-radius:8px;font-size:14px;color:#414535;">
                <strong>{{ 'COSTING_BC.DIRECT_COSTS.TOTAL_RAW_MATERIAL' | translate }}:</strong>
                S/. {{ directCosts.totalRawMaterial | number:'1.2-2' }} ·
                <strong>{{ 'COSTING_BC.DIRECT_COSTS.TOTAL_LABOR' | translate }}:</strong>
                S/. {{ directCosts.totalLaborCost | number:'1.2-2' }}
              </div>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-raised-button [disabled]="directForm.invalid || saving" (click)="saveDirect()" style="background:#414535;color:#fff;">
                <mat-icon>save</mat-icon>
                {{ 'COMMON.SAVE' | translate }}
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-tab>

        <!-- INDIRECT COSTS -->
        <mat-tab label="{{ 'COSTING_BC.INDIRECT_COSTS.TAB' | translate }}">
          <mat-card style="margin:16px 0;">
            <mat-card-content [formGroup]="indirectForm" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding-top:12px;">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.TRANSPORT' | translate }}</mat-label>
                <input matInput type="number" formControlName="transport" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.STORAGE_DAYS' | translate }}</mat-label>
                <input matInput type="number" formControlName="storageDays" min="0" step="1" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.DAILY_STORAGE' | translate }}</mat-label>
                <input matInput type="number" formControlName="dailyStorageCost" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.ELECTRICITY' | translate }}</mat-label>
                <input matInput type="number" formControlName="electricity" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.MAINTENANCE' | translate }}</mat-label>
                <input matInput type="number" formControlName="machineryMaintenance" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.SUPPLIES' | translate }}</mat-label>
                <input matInput type="number" formControlName="processingSupplies" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.WATER' | translate }}</mat-label>
                <input matInput type="number" formControlName="waterUsed" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.DEPRECIATION' | translate }}</mat-label>
                <input matInput type="number" formControlName="equipmentDepreciation" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.QUALITY' | translate }}</mat-label>
                <input matInput type="number" formControlName="qualityControl" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.CERTIFICATIONS' | translate }}</mat-label>
                <input matInput type="number" formControlName="certifications" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.INSURANCE' | translate }}</mat-label>
                <input matInput type="number" formControlName="insurance" min="0" step="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.INDIRECT_COSTS.ADMIN' | translate }}</mat-label>
                <input matInput type="number" formControlName="adminExpenses" min="0" step="0.01" />
              </mat-form-field>
              <div *ngIf="indirectCosts" style="grid-column:1 / span 3;padding:12px;background:#f8f7f2;border-radius:8px;font-size:14px;color:#414535;">
                <strong>{{ 'COSTING_BC.INDIRECT_COSTS.TOTAL_STORAGE' | translate }}:</strong>
                S/. {{ indirectCosts.totalStorageCost | number:'1.2-2' }}
              </div>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-raised-button [disabled]="indirectForm.invalid || saving" (click)="saveIndirect()" style="background:#414535;color:#fff;">
                <mat-icon>save</mat-icon>
                {{ 'COMMON.SAVE' | translate }}
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-tab>

        <!-- COMPUTE / SUMMARY / INDICATORS -->
        <mat-tab label="{{ 'COSTING_BC.COMPUTE.TAB' | translate }}">
          <mat-card style="margin:16px 0;">
            <mat-card-header>
              <mat-card-title>{{ 'COSTING_BC.COMPUTE.TITLE' | translate }}</mat-card-title>
              <mat-card-subtitle>{{ 'COSTING_BC.COMPUTE.SUBTITLE' | translate }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content [formGroup]="computeForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:12px;">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.COMPUTE.GRAMS_PER_CUP' | translate }}</mat-label>
                <input matInput type="number" formControlName="gramsPerCup" min="1" step="0.5" />
                <mat-hint>g</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'COSTING_BC.COMPUTE.MARGIN' | translate }}</mat-label>
                <input matInput type="number" formControlName="targetMarginPercentage" min="0" step="1" />
                <mat-hint>%</mat-hint>
              </mat-form-field>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-raised-button color="primary" (click)="compute()" [disabled]="computing" style="background:#4A5A54;color:white;">
                <mat-icon>calculate</mat-icon>
                {{ 'COSTING_BC.COMPUTE.BUTTON' | translate }}
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card *ngIf="costSummary" style="margin:16px 0;">
            <mat-card-header>
              <mat-card-title>{{ 'COSTING_BC.SUMMARY.TITLE' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-top:12px;font-size:14px;color:#414535;">
              <div><strong>{{ 'COSTING_BC.SUMMARY.RAW_MATERIAL' | translate }}:</strong> S/. {{ costSummary.rawMaterial | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.DIRECT_LABOR' | translate }}:</strong> S/. {{ costSummary.directLabor | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.TRANSPORT' | translate }}:</strong> S/. {{ costSummary.transport | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.STORAGE' | translate }}:</strong> S/. {{ costSummary.storage | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.PROCESSING' | translate }}:</strong> S/. {{ costSummary.processing | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.OTHER' | translate }}:</strong> S/. {{ costSummary.otherCosts | number:'1.2-2' }}</div>
              <mat-divider style="grid-column:1 / span 3;margin:8px 0;"></mat-divider>
              <div style="grid-column:1 / span 3;font-size:16px;"><strong>{{ 'COSTING_BC.SUMMARY.TOTAL' | translate }}:</strong> S/. {{ costSummary.total | number:'1.2-2' }}</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.COST_PER_KG' | translate }}:</strong> S/. {{ costSummary.costPerKg | number:'1.2-2' }}/kg</div>
              <div><strong>{{ 'COSTING_BC.SUMMARY.COST_PER_CUP' | translate }}:</strong> S/. {{ costSummary.costPerCup | number:'1.2-2' }}/taza</div>
            </mat-card-content>
          </mat-card>

          <mat-card *ngIf="financialIndicators" style="margin:16px 0;background:#f8f7f2;">
            <mat-card-header>
              <mat-card-title>{{ 'COSTING_BC.INDICATORS.TITLE' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-top:12px;color:#414535;">
              <div style="text-align:center;padding:16px;background:white;border-radius:8px;">
                <div style="font-size:13px;color:#666;">{{ 'COSTING_BC.INDICATORS.COST_PER_KG' | translate }}</div>
                <div style="font-size:20px;font-weight:700;">S/. {{ financialIndicators.costPerKg | number:'1.2-2' }}</div>
              </div>
              <div style="text-align:center;padding:16px;background:white;border-radius:8px;">
                <div style="font-size:13px;color:#666;">{{ 'COSTING_BC.INDICATORS.MARGIN' | translate }}</div>
                <div style="font-size:20px;font-weight:700;color:#2e7d32;">{{ financialIndicators.potentialMargin | number:'1.0-2' }}%</div>
              </div>
              <div style="text-align:center;padding:16px;background:white;border-radius:8px;">
                <div style="font-size:13px;color:#666;">{{ 'COSTING_BC.INDICATORS.SUGGESTED_PRICE' | translate }}</div>
                <div style="font-size:20px;font-weight:700;color:#4A5A54;">S/. {{ financialIndicators.suggestedPrice | number:'1.2-2' }}</div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- RECOMMENDATIONS -->
        <mat-tab label="{{ 'COSTING_BC.RECOMMENDATIONS.TAB' | translate }}">
          <app-recommendations-section [batchId]="batchId" />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class BatchDetailPageComponent implements OnInit {
  batchId = 0;
  batch: Batch | null = null;
  lots: CoffeeLot[] = [];
  directCosts: DirectCosts | null = null;
  indirectCosts: IndirectCosts | null = null;
  costSummary: CostSummary | null = null;
  financialIndicators: FinancialIndicators | null = null;

  directForm: FormGroup;
  indirectForm: FormGroup;
  computeForm: FormGroup;

  saving = false;
  computing = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService,
    private batchApi: BatchApi,
    private coffeeLotApi: CoffeeLotApi,
  ) {
    this.directForm = this.fb.group({
      coffeeLotId: [null, Validators.required],
      rawMaterialCost: [0, [Validators.required, Validators.min(0)]],
      coffeeQuantityKg: [0, [Validators.required, Validators.min(0.01)]],
      hoursWorked: [0, [Validators.required, Validators.min(0)]],
      costPerHour: [0, [Validators.required, Validators.min(0)]],
      numWorkers: [1, [Validators.required, Validators.min(0)]],
    });
    this.indirectForm = this.fb.group({
      transport: [0, [Validators.required, Validators.min(0)]],
      storageDays: [0, [Validators.required, Validators.min(0)]],
      dailyStorageCost: [0, [Validators.required, Validators.min(0)]],
      electricity: [0, [Validators.required, Validators.min(0)]],
      machineryMaintenance: [0, [Validators.required, Validators.min(0)]],
      processingSupplies: [0, [Validators.required, Validators.min(0)]],
      waterUsed: [0, [Validators.required, Validators.min(0)]],
      equipmentDepreciation: [0, [Validators.required, Validators.min(0)]],
      qualityControl: [0, [Validators.required, Validators.min(0)]],
      certifications: [0, [Validators.required, Validators.min(0)]],
      insurance: [0, [Validators.required, Validators.min(0)]],
      adminExpenses: [0, [Validators.required, Validators.min(0)]],
    });
    this.computeForm = this.fb.group({
      gramsPerCup: [18.0, [Validators.required, Validators.min(1)]],
      targetMarginPercentage: [45, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.batchId = Number(this.route.snapshot.paramMap.get('id'));
    this.coffeeLotApi.getAll().pipe(catchError(() => of([] as CoffeeLot[]))).subscribe((lots) => (this.lots = lots));
    this.loadBatch();
    this.loadDirect();
    this.loadIndirect();
    this.loadSummary();
    this.loadIndicators();
  }

  private loadBatch(): void {
    this.batchApi.getById(this.batchId).pipe(catchError((err) => {
      this.error = err.message;
      return of(null as Batch | null);
    })).subscribe((b) => (this.batch = b));
  }

  private loadDirect(): void {
    this.batchApi.loadDirectCosts(this.batchId).pipe(catchError(() => of(null as DirectCosts | null))).subscribe((d) => {
      this.directCosts = d;
      if (d) {
        this.directForm.patchValue({
          coffeeLotId: d.coffeeLotId,
          rawMaterialCost: d.rawMaterialCost,
          coffeeQuantityKg: d.coffeeQuantityKg,
          hoursWorked: d.hoursWorked,
          costPerHour: d.costPerHour,
          numWorkers: d.numWorkers,
        });
      }
    });
  }

  private loadIndirect(): void {
    this.batchApi.loadIndirectCosts(this.batchId).pipe(catchError(() => of(null as IndirectCosts | null))).subscribe((i) => {
      this.indirectCosts = i;
      if (i) {
        this.indirectForm.patchValue({
          transport: i.transport,
          storageDays: i.storageDays,
          dailyStorageCost: i.dailyStorageCost,
          electricity: i.electricity,
          machineryMaintenance: i.machineryMaintenance,
          processingSupplies: i.processingSupplies,
          waterUsed: i.waterUsed,
          equipmentDepreciation: i.equipmentDepreciation,
          qualityControl: i.qualityControl,
          certifications: i.certifications,
          insurance: i.insurance,
          adminExpenses: i.adminExpenses,
        });
      }
    });
  }

  private loadSummary(): void {
    this.batchApi.loadCostSummary(this.batchId).pipe(catchError(() => of(null as CostSummary | null))).subscribe((s) => (this.costSummary = s));
  }

  private loadIndicators(): void {
    this.batchApi.loadFinancialIndicators(this.batchId).pipe(catchError(() => of(null as FinancialIndicators | null))).subscribe((f) => (this.financialIndicators = f));
  }

  saveDirect(): void {
    if (this.directForm.invalid) return;
    this.saving = true;
    const v = this.directForm.value;
    this.batchApi.saveDirectCosts(this.batchId, {
      coffeeLotId: Number(v.coffeeLotId),
      rawMaterialCost: Number(v.rawMaterialCost),
      coffeeQuantityKg: Number(v.coffeeQuantityKg),
      hoursWorked: Number(v.hoursWorked),
      costPerHour: Number(v.costPerHour),
      numWorkers: Number(v.numWorkers),
    }).pipe(catchError((err) => {
      this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
      return of(null as DirectCosts | null);
    })).subscribe((saved) => {
      this.saving = false;
      if (saved) {
        this.directCosts = saved;
        this.snackBar.open(this.translate.instant('COMMON.SAVED'), undefined, { duration: 2500 });
      }
    });
  }

  saveIndirect(): void {
    if (this.indirectForm.invalid) return;
    this.saving = true;
    const v = this.indirectForm.value;
    this.batchApi.saveIndirectCosts(this.batchId, {
      transport: Number(v.transport),
      storageDays: Number(v.storageDays),
      dailyStorageCost: Number(v.dailyStorageCost),
      electricity: Number(v.electricity),
      machineryMaintenance: Number(v.machineryMaintenance),
      processingSupplies: Number(v.processingSupplies),
      waterUsed: Number(v.waterUsed),
      equipmentDepreciation: Number(v.equipmentDepreciation),
      qualityControl: Number(v.qualityControl),
      certifications: Number(v.certifications),
      insurance: Number(v.insurance),
      adminExpenses: Number(v.adminExpenses),
    }).pipe(catchError((err) => {
      this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
      return of(null as IndirectCosts | null);
    })).subscribe((saved) => {
      this.saving = false;
      if (saved) {
        this.indirectCosts = saved;
        this.snackBar.open(this.translate.instant('COMMON.SAVED'), undefined, { duration: 2500 });
      }
    });
  }

  compute(): void {
    if (this.computeForm.invalid) return;
    this.computing = true;
    const v = this.computeForm.value;
    this.batchApi.compute(this.batchId, {
      gramsPerCup: Number(v.gramsPerCup),
      targetMarginPercentage: Number(v.targetMarginPercentage),
    }).pipe(catchError((err) => {
      this.snackBar.open(err.message || 'Error', undefined, { duration: 5000 });
      return of(null);
    })).subscribe((report) => {
      this.computing = false;
      if (report) {
        // Reload from backend to apply assemblers consistently
        this.loadSummary();
        this.loadIndicators();
        this.snackBar.open(this.translate.instant('COSTING_BC.COMPUTE.OK'), undefined, { duration: 2500 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/costing/batches']);
  }

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    if (user.home) { this.router.navigate([user.home]); return; }
    switch (user.plan) {
      case 'barista': this.router.navigate(['/dashboard/barista']); break;
      case 'owner':   this.router.navigate(['/dashboard/owner']); break;
      case 'full':    this.router.navigate(['/dashboard/complete']); break;
      default:        this.router.navigate(['/']);
    }
  }
}
