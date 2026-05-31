import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import {
  IoTMonitoringData,
  IoTMonitoringDashboard,
  IoTMonitoringHistory,
  ThresholdRange,
  UpdateIoTMonitoringDataRequest,
} from '../../../domain/model/environmental-reading.entity';
import { IoTMonitoringService } from '../../../infrastructure/iot-monitoring.service';
import { ConfigureThresholdsDialogComponent } from '../../components/configure-thresholds-dialog/configure-thresholds-dialog.component';
import { CoffeeLotSummary } from '../../../domain/model/coffee-lot-summary.model';

// Register only the Chart.js components we need (tree-shakeable)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

@Component({
  selector: 'app-iot-monitoring-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    MatToolbar,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ToolbarComponent,
    TranslateModule,
  ],
  templateUrl: './iot-monitoring-dashboard.component.html',
  styleUrls: ['./iot-monitoring-dashboard.component.css', '../iot-monitoring-breadcrumb-shell.css'],
})
export class IotMonitoringDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('historyChart') chartCanvasRef!: ElementRef<HTMLCanvasElement>;
  private historyChart: Chart | null = null;

  monitoringData: IoTMonitoringData = {
    id: 0,
    sensorConnected: true,
    dehumidifierConnected: true,
    minTemperature: 18,
    maxTemperature: 24,
    minHumidity: 50,
    maxHumidity: 65,
    userId: 0,
  };

  thresholds: ThresholdRange = {
    minTemperature: 18,
    maxTemperature: 24,
    minHumidity: 50,
    maxHumidity: 65,
  };

  currentReading: IoTMonitoringHistory | null = null;
  readingHistory: IoTMonitoringHistory[] = [];
  activeAlerts: string[] = [];
  sensorStatus = '';
  environmentalStatus = '';
  dehumidifierStatus = '';
  lastUpdate: Date = new Date();
  readonly refreshSeconds = 30;

  isLoading = false;
  isGenerating = false;
  private chartReady = false;

  private refreshSubscription?: Subscription;

  coffeeLots: CoffeeLotSummary[] = [];
  selectedLotId: number | null = null;

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly iotService: IoTMonitoringService,
    private readonly snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.loadCoffeeLots();
    this.route.queryParams.subscribe((params) => {
      const lotIdParam = params['lotId'];
      if (lotIdParam) {
        this.selectedLotId = Number(lotIdParam);
        this.loadBatchHistory(this.selectedLotId);
      } else {
        this.loadDashboardData();
        this.refreshSubscription = interval(this.refreshSeconds * 1000).subscribe(() =>
          this.loadDashboardData(),
        );
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartReady = true;
    // If data already arrived before view was ready, paint now
    if (this.readingHistory.length > 0) {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.historyChart?.destroy();
  }

  // ─── Status getters ────────────────────────────────────────────────────────

  get environmentStatusKey(): string {
    if (this.environmentalStatus) return this.environmentalStatus;
    if (!this.currentReading) return 'IOT.DASHBOARD.STATUS_OPTIMAL';
    const isTempOk =
      this.currentReading.temperature >= this.thresholds.minTemperature &&
      this.currentReading.temperature <= this.thresholds.maxTemperature;
    const isHumidityOk =
      this.currentReading.humidity >= this.thresholds.minHumidity &&
      this.currentReading.humidity <= this.thresholds.maxHumidity;
    return isTempOk && isHumidityOk ? 'IOT.DASHBOARD.STATUS_OPTIMAL' : 'IOT.DASHBOARD.STATUS_WARNING';
  }

  get isEnvironmentOptimal(): boolean {
    return (
      this.environmentalStatus === 'OPTIMAL' ||
      this.environmentStatusKey === 'IOT.DASHBOARD.STATUS_OPTIMAL'
    );
  }

  get dehumidifierStatusKey(): string {
    if (this.dehumidifierStatus) return this.dehumidifierStatus;
    if (!this.currentReading) return 'IOT.DASHBOARD.DEHUMIDIFIER_OFF';
    return this.currentReading.humidity > this.thresholds.maxHumidity &&
      this.monitoringData.dehumidifierConnected
      ? 'IOT.DASHBOARD.DEHUMIDIFIER_ON'
      : 'IOT.DASHBOARD.DEHUMIDIFIER_OFF';
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  loadDashboardData(): void {
    this.isLoading = true;
    this.iotService.getDashboard(20).subscribe({
      next: (dashboard: IoTMonitoringDashboard) => {
        this.monitoringData = dashboard.monitoringData;
        this.thresholds = {
          minTemperature: dashboard.monitoringData.minTemperature,
          maxTemperature: dashboard.monitoringData.maxTemperature,
          minHumidity: dashboard.monitoringData.minHumidity,
          maxHumidity: dashboard.monitoringData.maxHumidity,
        };
        this.currentReading = dashboard.currentReading;
        this.readingHistory = dashboard.readingHistory;
        this.sensorStatus = dashboard.sensorStatus;
        this.environmentalStatus = dashboard.environmentalStatus;
        this.dehumidifierStatus = dashboard.dehumidifierStatus;
        this.activeAlerts = dashboard.activeAlerts;
        this.lastUpdate = new Date();
        this.isLoading = false;

        if (this.chartReady) {
          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: (err) => {
        console.error('[IoT Dashboard] Error loading dashboard:', err);
        this.isLoading = false;
        this.snackBar.open('Error al cargar el dashboard IoT', 'Cerrar', { duration: 4000 });
      },
    });
  }

  // ─── Simulator ─────────────────────────────────────────────────────────────

  generateReading(): void {
    if (this.isGenerating) return;
    this.isGenerating = true;
    this.iotService.generateSimulatedReading(this.selectedLotId).subscribe({
      next: (reading) => {
        this.isGenerating = false;
        this.snackBar.open(
          `Lectura generada — Temp: ${reading.temperature.toFixed(1)}°C | Humedad: ${reading.humidity.toFixed(0)}%`,
          'OK',
          { duration: 4000 },
        );
        // Reload the right data source after generating
        if (this.selectedLotId) {
          this.loadBatchHistory(this.selectedLotId);
        } else {
          this.loadDashboardData();
        }
      },
      error: (err) => {
        console.error('[IoT Simulator] Error generating reading:', err);
        this.isGenerating = false;
        this.snackBar.open('Error al generar la lectura simulada', 'Cerrar', { duration: 4000 });
      },
    });
  }

  // ─── Configure dialog ──────────────────────────────────────────────────────

  openConfigureRanges(): void {
    const dialogRef = this.dialog.open(ConfigureThresholdsDialogComponent, {
      width: '520px',
      data: this.thresholds,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result?: ThresholdRange) => {
      if (!result) return;

      const payload: UpdateIoTMonitoringDataRequest = {
        sensorConnected: this.monitoringData.sensorConnected,
        dehumidifierConnected: this.monitoringData.dehumidifierConnected,
        minTemperature: result.minTemperature,
        maxTemperature: result.maxTemperature,
        minHumidity: result.minHumidity,
        maxHumidity: result.maxHumidity,
      };

      this.iotService.updateData(this.monitoringData.id, payload).subscribe({
        next: (updated) => {
          this.monitoringData = updated;
          this.thresholds = { ...result };
          this.snackBar.open('Configuración actualizada correctamente', 'OK', { duration: 3000 });
          this.loadDashboardData();
        },
        error: (err) => {
          console.error('[IoT Config] Error updating thresholds:', err);
          this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  // ─── Chart ─────────────────────────────────────────────────────────────────

  private renderChart(): void {
    if (!this.chartCanvasRef) return;

    // Readings arrive newest-first from backend; reverse to show oldest → newest left-to-right
    const ordered = [...this.readingHistory].reverse();

    const labels = ordered.map((r, i) => `#${r.id ?? i + 1}`);
    const temps = ordered.map((r) => r.temperature);
    const humids = ordered.map((r) => r.humidity);

    if (this.historyChart) {
      // Update existing chart data in-place (smoother than destroy/recreate)
      this.historyChart.data.labels = labels;
      this.historyChart.data.datasets[0].data = temps;
      this.historyChart.data.datasets[1].data = humids;
      this.historyChart.update('active');
      return;
    }

    this.historyChart = new Chart(this.chartCanvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temps,
            borderColor: '#c06040',
            backgroundColor: 'rgba(192, 96, 64, 0.08)',
            pointBackgroundColor: '#c06040',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
            yAxisID: 'yTemp',
          },
          {
            label: 'Humedad (%)',
            data: humids,
            borderColor: '#5c8d89',
            backgroundColor: 'rgba(92, 141, 137, 0.10)',
            pointBackgroundColor: '#5c8d89',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
            yAxisID: 'yHumid',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 12, family: 'Inter, sans-serif' }, padding: 16 },
          },
          tooltip: {
            backgroundColor: '#2d3a36',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 11 }, maxRotation: 45, color: '#45615a' },
          },
          yTemp: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '°C', color: '#c06040', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { color: '#c06040', font: { size: 11 } },
          },
          yHumid: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '%', color: '#5c8d89', font: { size: 11 } },
            grid: { drawOnChartArea: false },
            ticks: { color: '#5c8d89', font: { size: 11 } },
          },
        },
      },
    });
  }

  // ─── Lot selection ─────────────────────────────────────────────────────────

  getSelectedLotName(): string {
    if (!this.selectedLotId) return '';
    const lot = this.coffeeLots.find((l) => l.id === this.selectedLotId);
    return lot ? lot.lotName : `Lote #${this.selectedLotId}`;
  }

  loadCoffeeLots(): void {
    this.iotService.getCoffeeLots().subscribe({
      next: (lots: CoffeeLotSummary[]) => {
        this.coffeeLots = lots;
      },
      error: (err) => {
        console.error('[IoT Dashboard] Error loading coffee lots:', err);
      },
    });
  }

  onLotChange(): void {
    if (this.selectedLotId) {
      // Pause real-time polling while viewing a specific lot
      this.refreshSubscription?.unsubscribe();
      this.refreshSubscription = undefined;
      this.loadBatchHistory(this.selectedLotId);
    } else {
      // Resume real-time polling
      this.loadDashboardData();
      this.refreshSubscription = interval(this.refreshSeconds * 1000).subscribe(() =>
        this.loadDashboardData(),
      );
    }
  }

  loadBatchHistory(batchId: number): void {
    this.isLoading = true;
    this.iotService.getHistoriesByBatch(batchId).subscribe({
      next: (histories: IoTMonitoringHistory[]) => {
        this.readingHistory = histories;
        this.currentReading = histories.length > 0 ? histories[0] : null;
        this.lastUpdate = new Date();
        this.isLoading = false;
        // Recompute alerts from thresholds and latest batch reading
        this.activeAlerts = [];
        if (this.currentReading) {
          if (this.currentReading.temperature < this.thresholds.minTemperature) {
            this.activeAlerts.push('IOT.ALERTS.TEMPERATURE_BELOW_MIN');
          } else if (this.currentReading.temperature > this.thresholds.maxTemperature) {
            this.activeAlerts.push('IOT.ALERTS.TEMPERATURE_ABOVE_MAX');
          }
          if (this.currentReading.humidity < this.thresholds.minHumidity) {
            this.activeAlerts.push('IOT.ALERTS.HUMIDITY_BELOW_MIN');
          } else if (this.currentReading.humidity > this.thresholds.maxHumidity) {
            this.activeAlerts.push('IOT.ALERTS.HUMIDITY_ABOVE_MAX');
          }
        }
        this.environmentalStatus = '';
        this.dehumidifierStatus = '';
        if (this.chartReady) {
          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: (err) => {
        console.error('[IoT Dashboard] Error loading batch history:', err);
        this.isLoading = false;
        this.snackBar.open('Error al cargar el historial del lote', 'Cerrar', { duration: 4000 });
      },
    });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    if (user.home) {
      void this.router.navigate([user.home]);
      return;
    }
    switch (user.plan) {
      case 'barista':
        void this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        void this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        void this.router.navigate(['/dashboard/complete']);
        break;
      default:
        void this.router.navigate(['/']);
    }
  }
}
