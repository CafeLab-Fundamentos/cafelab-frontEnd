import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import type { MonitoringAlert } from '../../../domain/model/monitoring-alert.entity';

@Component({
  selector: 'app-monitoring-alert-card',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './monitoring-alert-card.component.html',
  styleUrls: ['./monitoring-alert-card.component.css'],
})
export class MonitoringAlertCardComponent {
  @Input({ required: true }) alert!: MonitoringAlert;

  severityIcon(): string {
    const icons: Record<MonitoringAlert['severity'], string> = {
      critical: 'error',
      warning: 'warning_amber',
      info: 'info',
    };
    return icons[this.alert.severity];
  }
}
