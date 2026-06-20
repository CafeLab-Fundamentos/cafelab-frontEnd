export type MonitoringAlertSeverity = 'critical' | 'warning' | 'info';

export interface MonitoringAlert {
  id: string;
  severity: MonitoringAlertSeverity;
  title: string;
  description: string;
  lotLabel: string;
  time: string;
  occurredAt: string | null;
  metricIcon: string;
  metricValue: string;
  dismissed?: boolean;
}

export type MonitoringAlertFilter = 'all' | 'critical' | 'warning';
