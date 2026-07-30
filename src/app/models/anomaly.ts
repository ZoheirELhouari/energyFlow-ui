/** Interfaces matching the FastAPI LSTM + EHWS anomaly detection schemas. */

export type Severity = 'critical' | 'high' | 'medium' | 'normal';

/* ---------- Status ---------- */

export interface AnomalyStatusResponse {
  readonly trained: boolean;
  readonly window_size: number | null;
  readonly hidden_size: number | null;
  readonly num_clusters: number | null;
  readonly cluster_metrics: Record<string, ClusterTrainMetrics> | null;
}

/* ---------- Train ---------- */

export interface AnomalyTrainRequest {
  readonly job_id?: string | null;
  readonly window_size?: number;
  readonly epochs?: number;
  readonly hidden_size?: number;
}

export interface ClusterTrainMetrics {
  readonly mae: number;
  readonly mape: number;
}

export interface AnomalyTrainResponse {
  readonly num_clusters: number;
  readonly window_size: number;
  readonly epochs: number;
  readonly cluster_metrics: Record<string, ClusterTrainMetrics>;
}

/* ---------- Scan ---------- */

export interface AnomalyScanRequest {
  readonly k_threshold?: number;
  readonly l_param?: number;
  readonly max_results?: number;
  readonly job_id?: string | null;
}

export interface MeterAnomalyItem {
  readonly meter_id: number;
  readonly cluster_id: number;
  readonly anomaly_days: number;
  readonly total_days: number;
  readonly anomaly_ratio: number;
  readonly mape: number;
  readonly mae: number;
  readonly mean_deviation_kwh: number;
  readonly severity: Severity;
  readonly confidence: number;
  readonly peak_day_index: number;
  readonly peak_day_deviation_kwh: number;
  readonly is_fraud_suspect: boolean;
}

export interface ClusterAnomalyStats {
  readonly total_meters: number;
  readonly anomaly_count: number;
  readonly mean_mape: number;
  readonly fraud_suspects: number;
}

export interface ModelMetricsEntry {
  readonly mae: number;
  readonly mape: number;
}

export interface AnomalyScanResponse {
  readonly total_meters: number;
  readonly anomalous_meters: number;
  readonly critical_count: number;
  readonly high_count: number;
  readonly medium_count: number;
  readonly fraud_suspects: number;
  readonly model_metrics: Record<string, ModelMetricsEntry>;
  readonly cluster_stats: Record<string, ClusterAnomalyStats>;
  readonly anomalies: readonly MeterAnomalyItem[];
}

/* ---------- Meter detail ---------- */

export interface AnomalousDayDetail {
  readonly day_index: number;
  readonly is_anomaly: boolean;
  readonly deviation_kwh: number;
  readonly meter_kwh: number;
  readonly predicted_kwh: number | null;
  readonly centroid_kwh: number;
}

export interface MeterDetailResponse {
  readonly meter_id: number;
  readonly cluster_id: number;
  readonly cluster_name: string;
  readonly severity: Severity;
  readonly anomaly_days: number;
  readonly total_days: number;
  readonly anomaly_ratio: number;
  readonly mape: number;
  readonly mae: number;
  readonly confidence: number;
  readonly mean_deviation_kwh: number;
  readonly is_fraud_suspect: boolean;
  readonly meter_consumption: readonly number[];
  readonly predicted_consumption: readonly (number | null)[];
  readonly centroid_consumption: readonly number[];
  readonly daily_deviation: readonly (number | null)[];
  readonly anomaly_flags: readonly boolean[];
  readonly top_anomalous_days: readonly AnomalousDayDetail[];
}
