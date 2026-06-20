import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import type { MonitoredLotView } from '../../../domain/model/telemetry-record.entity';

@Component({
  selector: 'app-monitoring-lot-card',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './monitoring-lot-card.component.html',
  styleUrls: ['./monitoring-lot-card.component.css'],
})
export class MonitoringLotCardComponent {
  @Input({ required: true }) lot!: MonitoredLotView;

  statusLabelKey(): string {
    const keys: Record<MonitoredLotView['status'], string> = {
      optimal: 'MONITORING.LOTS.STATUS.OPTIMAL',
      warning: 'MONITORING.LOTS.STATUS.WARNING',
      critical: 'MONITORING.LOTS.STATUS.CRITICAL',
      unconfigured: 'MONITORING.LOTS.STATUS.UNCONFIGURED',
      no_data: 'MONITORING.LOTS.STATUS.NO_DATA',
    };
    return keys[this.lot.status];
  }

  actuatorMessageKey(): string | null {
    const { temperatureOutOfRange, humidityOutOfRange } = this.lot;

    if (temperatureOutOfRange && humidityOutOfRange) {
      return 'MONITORING.LOTS.ACTUATORS_BOTH';
    }
    if (temperatureOutOfRange) {
      return 'MONITORING.LOTS.ACTUATOR_TEMP';
    }
    if (humidityOutOfRange) {
      return 'MONITORING.LOTS.ACTUATOR_HUM';
    }
    return null;
  }
}
