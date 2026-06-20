import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, interval, startWith, Subscription, switchMap } from 'rxjs';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import type { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { DashboardNavigationService } from '../../../../shared/infrastructure/dashboard-navigation.service';
import { deriveRecentEventsFromTelemetry } from '../../../application/monitoring-alert.util';
import {
  average,
  buildNormalizedSeries,
  computeHealthScore,
  filterLast24Hours,
  humidityStatusLabelKey,
  qualityFromHealthScore,
  temperatureStatusLabelKey,
  type ChartPoint,
} from '../../../application/monitoring-analytics.util';
import { EnvironmentThresholdApi } from '../../../application/environment-threshold.api';
import { TelemetryRecordApi } from '../../../application/telemetry-record.api';
import type { EnvironmentThreshold } from '../../../domain/model/environment-threshold.entity';
import type { TelemetryRecord } from '../../../domain/model/telemetry-record.entity';
import { MonitoringTrendChartComponent } from '../../components/monitoring-trend-chart/monitoring-trend-chart.component';

const POLLING_INTERVAL_MS = 5_000;

interface RecentEventView {
  icon: string;
  title: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-monitoring-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbar,
    MatIconModule,
    RouterLink,
    ToolbarComponent,
    TranslatePipe,
    MonitoringTrendChartComponent,
  ],
  templateUrl: './monitoring-analytics-page.component.html',
  styleUrls: ['./monitoring-analytics-page.component.css'],
})
export class MonitoringAnalyticsPageComponent implements OnInit, OnDestroy {
  lots: CoffeeLot[] = [];
  selectedLotId: number | null = null;
  loadingLots = true;
  loadingAnalytics = false;
  errorMessage = '';

  avgTemperature: number | null = null;
  avgHumidity: number | null = null;
  temperatureStatusKey = 'MONITORING.ANALYTICS.KPI.NO_BASELINE';
  humidityStatusKey = 'MONITORING.ANALYTICS.KPI.NO_BASELINE';
  temperaturePoints: ChartPoint[] = [];
  humidityPoints: ChartPoint[] = [];
  healthScore: number | null = null;
  qualityLabelKey = 'MONITORING.ANALYTICS.KPI.NO_DATA';
  qualityGradeKey = 'MONITORING.ANALYTICS.KPI.NO_BASELINE';
  lotMeta = '';
  recentEvents: RecentEventView[] = [];

  private pollingSubscription?: Subscription;

  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly telemetryRecordApi: TelemetryRecordApi,
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
          this.startPolling(lots[0].id);
        }
      },
      error: () => {
        this.loadingLots = false;
        this.errorMessage = this.translate.instant(
          'MONITORING.ANALYTICS.ERRORS.LOAD_LOTS',
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
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
    this.startPolling(lotId);
  }

  goToHome(): void {
    this.dashboardNavigation.goToHome();
  }

  private startPolling(coffeeLotId: number): void {
    this.pollingSubscription?.unsubscribe();
    this.loadingAnalytics = true;
    this.pollingSubscription = interval(POLLING_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          forkJoin({
            history: this.telemetryRecordApi.getHistoryByCoffeeLotId(coffeeLotId),
            threshold: this.environmentThresholdApi.getByCoffeeLotId(coffeeLotId),
          }),
        ),
      )
      .subscribe({
        next: ({ history, threshold }) => {
          this.applyAnalytics(history, threshold, coffeeLotId);
          this.loadingAnalytics = false;
          this.errorMessage = '';
        },
        error: () => {
          this.loadingAnalytics = false;
          this.errorMessage = this.translate.instant(
            'MONITORING.ANALYTICS.ERRORS.LOAD_ANALYTICS',
          );
        },
      });
  }

  private applyAnalytics(
    history: TelemetryRecord[],
    threshold: EnvironmentThreshold | null,
    coffeeLotId: number,
  ): void {
    const last24h = filterLast24Hours(history);
    const dataset = last24h.length > 0 ? last24h : history;
    const latest = dataset.length ? dataset[dataset.length - 1] : null;
    const lot = this.lots.find((item) => item.id === coffeeLotId);

    this.avgTemperature = average(dataset.map((record) => record.temperature));
    this.avgHumidity = average(dataset.map((record) => record.humidity));
    this.temperatureStatusKey = temperatureStatusLabelKey(latest, threshold);
    this.humidityStatusKey = humidityStatusLabelKey(latest, threshold);
    this.temperaturePoints = buildNormalizedSeries(
      dataset.map((record) => record.temperature),
    );
    this.humidityPoints = buildNormalizedSeries(
      dataset.map((record) => record.humidity),
    );

    this.healthScore = computeHealthScore(dataset, threshold);
    const quality = qualityFromHealthScore(this.healthScore);
    this.qualityLabelKey = quality.labelKey;
    this.qualityGradeKey = quality.gradeKey;

    this.recentEvents = deriveRecentEventsFromTelemetry(
      dataset,
      threshold,
      this.translate,
    );

    if (lot) {
      this.lotMeta = this.translate.instant('MONITORING.ANALYTICS.HEALTH.META', {
        status: lot.status,
        weight: lot.weight,
        origin: lot.origin,
      });
    } else {
      this.lotMeta = '';
    }
  }
}
