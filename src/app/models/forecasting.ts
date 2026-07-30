/** Interfaces matching the FastAPI forecasting schemas. */

export interface ForecastRequest {
  readonly cluster_id?: number | null;
  readonly meter_id?: number | null;
  readonly horizon: number;
  readonly start_year_date: string;
  readonly job_id?: string | null;
}

export interface TrainRequest {
  readonly start_year_date?: string;
  readonly job_id?: string | null;
}

export interface DayForecast {
  readonly day_offset: number;
  readonly date: string;
  readonly predicted_consumption_kwh: number;
  readonly lower_bound_95: number;
  readonly upper_bound_95: number;
}

export interface ModelMetrics {
  readonly avg_mape: number;
  readonly avg_mae: number;
  readonly avg_rmse: number;
}

export interface ClusterForecastResponse {
  readonly cluster_id: number;
  readonly cluster_name: string;
  readonly horizon_days: number;
  readonly predictions: readonly DayForecast[];
  readonly model_metrics: ModelMetrics;
}

export interface MeterForecastResponse extends ClusterForecastResponse {
  readonly meter_id: number;
  readonly meter_scaling_factor: number;
}

export interface TrainResponse {
  readonly status: string;
  readonly clusters_trained: number;
  readonly per_cluster_metrics: Record<string, ModelMetrics>;
  readonly total_training_time_seconds: number;
}

export interface ForecastEvaluationFold {
  readonly fold: number;
  readonly train_size: number;
  readonly test_size: number;
  readonly mae: number;
  readonly rmse: number;
  readonly mape: number;
}

export interface ForecastEvaluationResponse {
  readonly cluster_id: number;
  readonly cluster_name: string;
  readonly folds: readonly ForecastEvaluationFold[];
  readonly average_metrics: ModelMetrics;
}

export interface FeatureImportanceEntry {
  readonly name: string;
  readonly importance: number;
}

export interface FeatureImportanceResponse {
  readonly cluster_id: number;
  readonly features: readonly FeatureImportanceEntry[];
}
