import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environment/environment';
import type {
  ClusterForecastResponse,
  FeatureImportanceResponse,
  ForecastEvaluationResponse,
  ForecastRequest,
  MeterForecastResponse,
  TrainRequest,
  TrainResponse,
} from '../models/forecasting';

@Injectable({ providedIn: 'root' })
export class ForecastingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/forecasting`;

  trainModel(body: TrainRequest = {}): Observable<TrainResponse> {
    return this.http.post<TrainResponse>(`${this.base}/train`, body);
  }

  predict(body: ForecastRequest): Observable<ClusterForecastResponse> {
    return this.http.post<ClusterForecastResponse>(`${this.base}/predict`, body);
  }

  predictMeter(body: ForecastRequest): Observable<MeterForecastResponse> {
    return this.http.post<MeterForecastResponse>(`${this.base}/predict`, body);
  }

  evaluateModel(clusterId: number): Observable<ForecastEvaluationResponse> {
    return this.http.get<ForecastEvaluationResponse>(
      `${this.base}/evaluate/${clusterId}`,
    );
  }

  getFeatureImportance(clusterId: number): Observable<FeatureImportanceResponse> {
    return this.http.get<FeatureImportanceResponse>(
      `${this.base}/feature-importance/${clusterId}`,
    );
  }
}
