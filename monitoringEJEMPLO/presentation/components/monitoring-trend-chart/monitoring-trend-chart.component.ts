import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ChartPoint } from '../../../application/monitoring-analytics.util';
import { toPolyline } from '../../../application/monitoring-analytics.util';

@Component({
  selector: 'app-monitoring-trend-chart',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './monitoring-trend-chart.component.html',
  styleUrls: ['./monitoring-trend-chart.component.css'],
})
export class MonitoringTrendChartComponent {
  @Input() temperaturePoints: ChartPoint[] = [];
  @Input() humidityPoints: ChartPoint[] = [];

  readonly viewWidth = 100;
  readonly viewHeight = 48;

  get temperaturePolyline(): string {
    return toPolyline(this.temperaturePoints, this.viewWidth, this.viewHeight);
  }

  get humidityPolyline(): string {
    return toPolyline(this.humidityPoints, this.viewWidth, this.viewHeight);
  }

  get hasData(): boolean {
    return this.temperaturePoints.length > 0 || this.humidityPoints.length > 0;
  }
}
