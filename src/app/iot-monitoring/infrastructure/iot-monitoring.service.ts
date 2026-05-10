import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  IoTMonitoringDashboard,
  IoTMonitoringData,
  IoTSimulatorReading,
  UpdateIoTMonitoringDataRequest,
} from '../domain/model/environmental-reading.entity';

/**
 * Servicio HTTP para el bounded context de IoT Monitoring.
 * Todos los endpoints requieren JWT autenticado; el backend resuelve el userId desde el token.
 */
@Injectable({
  providedIn: 'root',
})
export class IoTMonitoringService {
  private readonly baseUrl = environment.serverBaseUrl;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  };

  constructor(private readonly http: HttpClient) { }

  /**
   * GET /api/v1/iot-monitoring/dashboard
   * Retorna dashboard completo: configuración, lectura actual, historial, estados y alertas.
   * @param limit Número máximo de entradas en el historial (default: 20)
   */
  getDashboard(limit = 20): Observable<IoTMonitoringDashboard> {
    const url = `${this.baseUrl}${environment.iotMonitoringDashboardEndpointPath}?limit=${limit}`;
    return this.http.get<IoTMonitoringDashboard>(url, this.httpOptions);
  }

  /**
   * GET /api/v1/iot-monitoring/data
   * Retorna (o crea con defaults) la configuración IoT del usuario autenticado.
   */
  getData(): Observable<IoTMonitoringData> {
    const url = `${this.baseUrl}${environment.iotMonitoringDataEndpointPath}`;
    return this.http.get<IoTMonitoringData>(url, this.httpOptions);
  }

  /**
   * PUT /api/v1/iot-monitoring/data/{dataId}
   * Actualiza los umbrales y estado de conexión de la configuración IoT.
   */
  updateData(dataId: number, payload: UpdateIoTMonitoringDataRequest): Observable<IoTMonitoringData> {
    const url = `${this.baseUrl}${environment.iotMonitoringDataEndpointPath}/${dataId}`;
    return this.http.put<IoTMonitoringData>(url, payload, this.httpOptions);
  }

  /**
   * POST /api/v1/iot-monitoring/simulator/generate-reading
   * Genera una lectura aleatoria en el servidor, la persiste en BD y la retorna.
   */
  generateSimulatedReading(): Observable<IoTSimulatorReading> {
    const url = `${this.baseUrl}${environment.iotMonitoringSimulatorEndpointPath}`;
    return this.http.post<IoTSimulatorReading>(url, {}, this.httpOptions);
  }
}
