import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MetricsCardComponent } from '../../components/metrics-card/metrics-card.component';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { StepLotSelectionComponent } from '../../components/step-lot-selection/step-lot-selection.component';
import { StepDirectCostsComponent } from '../../components/step-direct-costs/step-direct-costs.component';
import { StepIndirectCostsComponent } from '../../components/step-indirect-costs/step-indirect-costs.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductionCostCalculation } from '../../../domain/model/production-cost.entity';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { ProductionCostService } from '../../../infrastructure/production-cost.service';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { BatchApi } from '../../../../costing/batch/application/batch.api';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-production-cost-page',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule,
    MatInputModule,
    MatCardModule,
    ReactiveFormsModule,
    MetricsCardComponent,
    ToolbarComponent,
    StepLotSelectionComponent,
    StepDirectCostsComponent,
    StepIndirectCostsComponent,
    TranslateModule,
    MatTableModule,
    MatToolbarModule,
    MatListModule,
  ],
  templateUrl: './production-cost-management.component.html',
  styleUrl: './production-cost-management.component.css',
})
export class ProductionCostPageComponent implements OnInit {
  firstFormGroup!: FormGroup;
  directCostsForm!: FormGroup;
  indirectCostsForm!: FormGroup;
  currentStep = 0;
  
  totalSteps = 4;
  isSubmitting = false;
  isSuccess = false;
  registrationCode = '';
  readonly EXPECTED_MARGIN = 45;
  costSummary: { tipo: string; monto: number }[] = [];
  lots: CoffeeLot[] = [];
  loading = false;
  error: string | null = null;
  currentCalculation: ProductionCostCalculation | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private productionCostService: ProductionCostService,
    private coffeeLotApi: CoffeeLotApi,
    private batchApi: BatchApi,
  ) {
    this.firstFormGroup = this.fb.group({
      selectedLot: ['', Validators.required],
    });

    this.directCostsForm = this.fb.group({
      rawMaterials: this.fb.group({
        costPerKg: [0, [Validators.required, Validators.min(0)]],
        quantity: [0, [Validators.required, Validators.min(0)]],
      }),
      labor: this.fb.group({
        hoursWorked: [0, [Validators.required, Validators.min(0)]],
        costPerHour: [0, [Validators.required, Validators.min(0)]],
        numberOfWorkers: [1, [Validators.required, Validators.min(1)]],
      }),
    });

    this.indirectCostsForm = this.fb.group({
      transport: this.fb.group({
        costPerKg: [0, [Validators.required, Validators.min(0)]],
        quantity: [0, [Validators.required, Validators.min(0)]],
      }),
      storage: this.fb.group({
        daysInStorage: [0, [Validators.required, Validators.min(0)]],
        dailyCost: [0, [Validators.required, Validators.min(0)]],
      }),
      processing: this.fb.group({
        electricity: [0, [Validators.required, Validators.min(0)]],
        maintenance: [0, [Validators.required, Validators.min(0)]],
        supplies: [0, [Validators.required, Validators.min(0)]],
        water: [0, [Validators.required, Validators.min(0)]],
        depreciation: [0, [Validators.required, Validators.min(0)]],
      }),
      others: this.fb.group({
        qualityControl: [0, [Validators.required, Validators.min(0)]],
        certifications: [0, [Validators.required, Validators.min(0)]],
        insurance: [0, [Validators.required, Validators.min(0)]],
        administrative: [0, [Validators.required, Validators.min(0)]],
      }),
    });
  }

  ngOnInit(): void {
    this.loadLots();
  }

  loadLots(): void {
    this.loading = true;
    const userId = Number(this.authService.getCurrentUserId());

    if (!userId || isNaN(userId)) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.AUTH_USER');
      this.loading = false;
      return;
    }

    this.coffeeLotApi.getAll().subscribe({
      next: (list: CoffeeLot[]) => {
        this.lots = list;
        this.loading = false;
        this.error = null;
      },
      error: (err: unknown) => {
        console.error('Error loading lots:', err);
        this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.LOAD_LOTS');
        this.loading = false;
      },
    });
  }

  
  private rawMaterialsQuantityKg(): number {
    const q = this.directCostsForm.get('rawMaterials')?.value?.quantity;
    const n = Number(q);
    return Number.isFinite(n) ? n : 0;
  }

  saveProductionCost(): void {
    if (!this.isFormValid()) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.FORM_REQUIRED');
      return;
    }

    this.isSubmitting = true;
    const userId = Number(this.authService.getCurrentUserId());
    const selectedLotId = Number(this.firstFormGroup.value.selectedLot);

    if (!userId || !selectedLotId) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.INVALID_USER_LOT');
      this.isSubmitting = false;
      return;
    }

    const selectedLot = this.lots.find((lot) => Number(lot.id) === selectedLotId);
    if (!selectedLot) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.INVALID_SELECTED_LOT');
      this.isSubmitting = false;
      return;
    }

    const totalKg = this.rawMaterialsQuantityKg();
    if (totalKg <= 0) {
      this.error = this.translate.instant('COST_MANAGEMENT.ERRORS.QUANTITY_KG_REQUIRED');
      this.isSubmitting = false;
      return;
    }

    this.calculateResumen();

    // Persistir todo en backend Costing BC:
    // 1) POST batch  2) PUT direct-costs  3) PUT indirect-costs  4) POST compute
    const directRaw = this.directCostsForm.get('rawMaterials')?.value || {};
    const directLabor = this.directCostsForm.get('labor')?.value || {};
    const indProc = this.indirectCostsForm.get('processing')?.value || {};
    const indOther = this.indirectCostsForm.get('others')?.value || {};
    const indTransport = this.indirectCostsForm.get('transport')?.value || {};
    const indStorage = this.indirectCostsForm.get('storage')?.value || {};

    const batchName = `${selectedLot.lot_name} - ${new Date().toISOString().slice(0, 10)}`;
    const today = new Date().toISOString().slice(0, 10);

    let createdBatchId = 0;

    this.batchApi
      .create({ batchName, registrationDate: today })
      .pipe(
        switchMap((batch) => {
          createdBatchId = batch.id;
          return this.batchApi.saveDirectCosts(batch.id, {
            coffeeLotId: selectedLotId,
            rawMaterialCost: Number(directRaw.costPerKg) || 0,
            coffeeQuantityKg: totalKg,
            hoursWorked: Number(directLabor.hoursWorked) || 0,
            costPerHour: Number(directLabor.costPerHour) || 0,
            numWorkers: Number(directLabor.numberOfWorkers) || 0,
          });
        }),
        switchMap(() =>
          this.batchApi.saveIndirectCosts(createdBatchId, {
            transport:
              (Number(indTransport.costPerKg) || 0) * (Number(indTransport.quantity) || 0),
            storageDays: Number(indStorage.daysInStorage) || 0,
            dailyStorageCost: Number(indStorage.dailyCost) || 0,
            electricity: Number(indProc.electricity) || 0,
            machineryMaintenance: Number(indProc.maintenance) || 0,
            processingSupplies: Number(indProc.supplies) || 0,
            waterUsed: Number(indProc.water) || 0,
            equipmentDepreciation: Number(indProc.depreciation) || 0,
            qualityControl: Number(indOther.qualityControl) || 0,
            certifications: Number(indOther.certifications) || 0,
            insurance: Number(indOther.insurance) || 0,
            adminExpenses: Number(indOther.administrative) || 0,
          }),
        ),
        switchMap(() =>
          this.batchApi.compute(createdBatchId, {
            gramsPerCup: 18.0,
            targetMarginPercentage: this.EXPECTED_MARGIN,
          }),
        ),
      )
      .subscribe({
        next: (report) => {
          // Hidratar la vista de éxito con los valores persistidos por el backend.
          this.currentCalculation = {
            coffeeLotId: selectedLotId,
            coffeeLotName: selectedLot.lot_name,
            coffeeType: selectedLot.coffee_type,
            totalKg,
            rawMaterialsCost: Number(report.costSummary.rawMaterial),
            laborCost: Number(report.costSummary.directLabor),
            transportCost: Number(report.costSummary.transport),
            storageCost: Number(report.costSummary.storage),
            processingCost: Number(report.costSummary.processing),
            otherIndirectCosts: Number(report.costSummary.otherCosts),
            totalDirectCost:
              Number(report.costSummary.rawMaterial) + Number(report.costSummary.directLabor),
            totalIndirectCost:
              Number(report.costSummary.total) -
              Number(report.costSummary.rawMaterial) -
              Number(report.costSummary.directLabor),
            totalCost: Number(report.costSummary.total),
            costPerKg: Number(report.costSummary.costPerKg),
            margin: Number(report.financialIndicators.potentialMargin),
            suggestedPrice: Number(report.financialIndicators.suggestedPrice),
            potentialMargin: Number(report.financialIndicators.potentialMargin),
            calculatedAt: new Date().toISOString(),
            userId,
          };
          this.isSuccess = true;
          this.registrationCode = `CP-${new Date().getFullYear()}-${createdBatchId}`;
          this.isSubmitting = false;
          this.error = null;
        },
        error: (err: Error) => {
          console.error('[Costing] Backend persistence failed', err);
          // Fallback: cálculo local (modo offline) para no perder UX.
          this.currentCalculation = this.productionCostService.calculateProductionCost({
            coffeeLotId: selectedLotId,
            coffeeLotName: selectedLot.lot_name,
            coffeeType: selectedLot.coffee_type,
            totalKg,
            rawMaterialsCost: this.rawMaterialTotal,
            laborCost: this.laborTotal,
            transportCost: this.transportTotal,
            storageCost: this.storageTotal,
            processingCost: this.processingTotal,
            otherIndirectCosts: this.othersTotal,
            margin: this.EXPECTED_MARGIN,
          });
          this.isSuccess = true;
          this.registrationCode = `CP-${new Date().getFullYear()}-LOCAL`;
          this.isSubmitting = false;
          this.error = err.message || this.translate.instant('COST_MANAGEMENT.ERRORS.PERSIST_FAILED');
        },
      });
  }

  downloadPDF(): void {
    if (this.currentCalculation) {
      this.productionCostService.generatePDF(this.currentCalculation);
    }
  }

  resetForm(): void {
    this.isSuccess = false;
    this.currentCalculation = null;
    this.registrationCode = '';
    this.error = null;
    this.currentStep = 0;

    this.firstFormGroup.reset();
    this.directCostsForm.reset();
    this.indirectCostsForm.reset();

    this.directCostsForm.patchValue({
      labor: { numberOfWorkers: 1 },
    });
  }

  private isFormValid(): boolean {
    return (
      this.firstFormGroup.valid &&
      this.directCostsForm.valid &&
      this.indirectCostsForm.valid
    );
  }

  onCancel = () => {
    this.goToHome();
  };

  get progressValue(): number {
    return (this.currentStep / (this.totalSteps - 1)) * 100;
  }

  get rawMaterialTotal(): number {
    const { costPerKg, quantity } = this.directCostsForm.get('rawMaterials')?.value || {};
    return costPerKg * quantity;
  }

  get laborTotal(): number {
    const { hoursWorked, costPerHour, numberOfWorkers } =
      this.directCostsForm.get('labor')?.value || {};
    return hoursWorked * costPerHour * numberOfWorkers;
  }

  get transportTotal(): number {
    const { costPerKg, quantity } = this.indirectCostsForm.get('transport')?.value || {};
    return costPerKg * quantity;
  }

  get storageTotal(): number {
    const { daysInStorage, dailyCost } = this.indirectCostsForm.get('storage')?.value || {};
    return daysInStorage * dailyCost;
  }

  get processingTotal(): number {
    const p = this.indirectCostsForm.get('processing')?.value || {};
    return p.electricity + p.maintenance + p.supplies + p.water + p.depreciation;
  }

  get othersTotal(): number {
    const o = this.indirectCostsForm.get('others')?.value || {};
    return o.qualityControl + o.certifications + o.insurance + o.administrative;
  }

  get totalDirectCosts(): number {
    return this.rawMaterialTotal + this.laborTotal;
  }

  get totalIndirectCosts(): number {
    return this.transportTotal + this.storageTotal + this.processingTotal + this.othersTotal;
  }

  get grandTotal(): number {
    return this.totalDirectCosts + this.totalIndirectCosts;
  }

  get costPerKg(): number {
    const qty = this.rawMaterialsQuantityKg();
    return qty > 0 ? this.grandTotal / qty : 0;
  }

  get potentialMargin(): number {
    const sp = this.suggestedPrice;
    const cpk = this.costPerKg;
    return sp > 0 ? ((sp - cpk) / sp) * 100 : 0;
  }

  get suggestedPrice(): number {
    return this.costPerKg * (1 + this.EXPECTED_MARGIN / 100);
  }

  calculateResumen(): void {
    this.costSummary = [
      { tipo: 'COST_MANAGEMENT.RAW_MATERIAL', monto: this.rawMaterialTotal },
      { tipo: 'COST_MANAGEMENT.DIRECT_LABOR', monto: this.laborTotal },
      { tipo: 'COST_MANAGEMENT.INDIRECT_COSTS', monto: this.totalIndirectCosts },
    ];
  }

  onSubmit(): void {
    this.saveProductionCost();
  }

  onExit(): void {
    this.goToHome();
  }

  onPrint(): void {
    this.downloadPDF();
  }

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    switch (user.plan) {
      case 'barista':
        this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        this.router.navigate(['/dashboard/complete']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

}