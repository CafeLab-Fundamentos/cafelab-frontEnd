import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import type { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { DashboardNavigationService } from '../../../../shared/infrastructure/dashboard-navigation.service';
import { EnvironmentThresholdApi } from '../../../application/environment-threshold.api';
import type { EnvironmentThresholdFormValues } from '../../../domain/model/environment-threshold.entity';

const DEFAULT_FORM: EnvironmentThresholdFormValues = {
  minTemperature: 18.5,
  maxTemperature: 24,
  minHumidity: 45,
  maxHumidity: 60,
  syncIntervalSeconds: 10,
};

const MIN_SYNC_INTERVAL_SECONDS = 5;

@Component({
  selector: 'app-monitoring-configuration-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbar,
    MatIconModule,
    RouterLink,
    ToolbarComponent,
    TranslatePipe,
  ],
  templateUrl: './monitoring-configuration-page.component.html',
  styleUrls: ['./monitoring-configuration-page.component.css'],
})
export class MonitoringConfigurationPageComponent implements OnInit {
  lots: CoffeeLot[] = [];
  selectedLotId: number | null = null;
  formValues: EnvironmentThresholdFormValues = { ...DEFAULT_FORM };
  savedValues: EnvironmentThresholdFormValues = { ...DEFAULT_FORM };
  thresholdExists = false;
  loadingLots = true;
  loadingThreshold = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly environmentThresholdApi: EnvironmentThresholdApi,
    private readonly dashboardNavigation: DashboardNavigationService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.coffeeLotApi.getAll().subscribe({
      next: (lots) => {
        this.lots = lots;
        this.loadingLots = false;
        if (lots.length > 0) {
          this.selectedLotId = lots[0].id;
          this.loadThresholdForLot(lots[0].id);
        }
      },
      error: () => {
        this.loadingLots = false;
        this.errorMessage = this.translate.instant(
          'MONITORING.CONFIGURATION.ERRORS.LOAD_LOTS',
        );
      },
    });
  }

  get selectedLotLabel(): string {
    const lot = this.lots.find((item) => item.id === this.selectedLotId);
    if (!lot) {
      return '';
    }
    return `${lot.lot_name}: ${lot.coffee_type}`;
  }

  onLotChange(lotId: number): void {
    if (!lotId || Number.isNaN(lotId)) {
      return;
    }
    this.selectedLotId = lotId;
    this.loadThresholdForLot(lotId);
  }

  adjustValue(
    field: keyof EnvironmentThresholdFormValues,
    delta: number,
  ): void {
    const decimals = field.includes('Temperature') ? 1 : 0;
    const next = Number((this.formValues[field] + delta).toFixed(decimals));
    this.formValues = { ...this.formValues, [field]: next };
    this.successMessage = '';
  }

  resetForm(): void {
    this.formValues = { ...this.savedValues };
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveConfiguration(): void {
    if (!this.selectedLotId) {
      return;
    }

    const validationError = this.validateForm();
    if (validationError) {
      this.errorMessage = validationError;
      this.successMessage = '';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.environmentThresholdApi
      .save(this.selectedLotId, this.formValues, this.thresholdExists)
      .subscribe({
        next: (saved) => {
          this.thresholdExists = true;
          this.formValues = {
            minTemperature: saved.minTemperature,
            maxTemperature: saved.maxTemperature,
            minHumidity: saved.minHumidity,
            maxHumidity: saved.maxHumidity,
            syncIntervalSeconds:
              saved.syncIntervalSeconds ?? this.formValues.syncIntervalSeconds,
          };
          this.savedValues = { ...this.formValues };
          this.saving = false;
          this.successMessage = this.translate.instant(
            'MONITORING.CONFIGURATION.SUCCESS.SAVED',
          );
        },
        error: (error: unknown) => {
          this.saving = false;
          const message =
            error instanceof Error
              ? error.message
              : this.translate.instant('MONITORING.CONFIGURATION.ERRORS.SAVE');
          this.errorMessage = message;
        },
      });
  }

  goToHome(): void {
    this.dashboardNavigation.goToHome();
  }

  private loadThresholdForLot(coffeeLotId: number): void {
    this.loadingThreshold = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.environmentThresholdApi.getByCoffeeLotId(coffeeLotId).subscribe({
      next: (threshold) => {
        if (threshold) {
          this.thresholdExists = true;
          this.formValues = {
            minTemperature: threshold.minTemperature,
            maxTemperature: threshold.maxTemperature,
            minHumidity: threshold.minHumidity,
            maxHumidity: threshold.maxHumidity,
            syncIntervalSeconds:
              threshold.syncIntervalSeconds ?? DEFAULT_FORM.syncIntervalSeconds,
          };
        } else {
          this.thresholdExists = false;
          this.formValues = { ...DEFAULT_FORM };
        }
        this.savedValues = { ...this.formValues };
        this.loadingThreshold = false;
      },
      error: () => {
        this.loadingThreshold = false;
        this.errorMessage = this.translate.instant(
          'MONITORING.CONFIGURATION.ERRORS.LOAD_THRESHOLD',
        );
      },
    });
  }

  private validateForm(): string {
    const { minTemperature, maxTemperature, minHumidity, maxHumidity } =
      this.formValues;

    if (minTemperature > maxTemperature) {
      return this.translate.instant(
        'MONITORING.CONFIGURATION.ERRORS.TEMP_RANGE',
      );
    }

    if (minHumidity > maxHumidity) {
      return this.translate.instant(
        'MONITORING.CONFIGURATION.ERRORS.HUMIDITY_RANGE',
      );
    }

    if (minHumidity < 0 || maxHumidity > 100) {
      return this.translate.instant(
        'MONITORING.CONFIGURATION.ERRORS.HUMIDITY_BOUNDS',
      );
    }

    if (
      !Number.isFinite(this.formValues.syncIntervalSeconds) ||
      this.formValues.syncIntervalSeconds < MIN_SYNC_INTERVAL_SECONDS
    ) {
      return `El intervalo de sincronización debe ser de al menos ${MIN_SYNC_INTERVAL_SECONDS} segundos.`;
    }

    return '';
  }
}
