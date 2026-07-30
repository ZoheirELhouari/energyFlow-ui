import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environment/environment';
import type {
  AnomalyStatusResponse,
  AnomalyTrainRequest,
  AnomalyTrainResponse,
  AnomalyScanRequest,
  AnomalyScanResponse,
  MeterDetailResponse,
} from '../models/anomaly';

@Injectable({ providedIn: 'root' })
export class AnomalyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/anomaly`;

  getStatus(): Observable<AnomalyStatusResponse> {
    return this.http.get<AnomalyStatusResponse>(`${this.base}/status`);
  }

  train(body: AnomalyTrainRequest = {}): Observable<AnomalyTrainResponse> {
    return this.http.post<AnomalyTrainResponse>(`${this.base}/train`, body);
  }

  scan(body: AnomalyScanRequest = {}): Observable<AnomalyScanResponse> {
    return this.http.post<AnomalyScanResponse>(`${this.base}/scan`, body);
  }

  getMeterDetail(meterId: number): Observable<MeterDetailResponse> {
    return this.http.get<MeterDetailResponse>(`${this.base}/meter/${meterId}`);
  }
}
