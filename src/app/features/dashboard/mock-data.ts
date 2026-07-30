/**
 * Supplemental data for the Segmentation dashboard.
 *
 * Real cluster metrics come from the backend (see SegmentationService). This
 * file only holds:
 *   - synthetic 24h and forecast profile generators (the API returns a
 *     365-day centroid, so half-hourly profiles are fabricated for display),
 *   - hardcoded anomalies and geographic zone splits (no backend endpoint
 *     exists for these yet),
 *   - presentation constants used by the KPI row.
 */

import type { Cluster } from '../../models/segmentation';

/** Half-hourly time labels for a full 24h day (48 slots). */
export const HOURLY_SLOTS: readonly string[] = Array.from({ length: 48 }, (_, i) => {
  const hh = Math.floor(i / 2).toString().padStart(2, '0');
  const mm = i % 2 === 0 ? '00' : '30';
  return `${hh}:${mm}`;
});

/**
 * Generate a deterministic 48-point 24h load profile scaled to the cluster's
 * real `avgConsumption` from the backend. Heavy Industrial (id 5) gets a
 * much higher flat-ish profile peaking mid-day; all others follow a typical
 * residential/commercial two-peak shape.
 */
export function generate24hProfile(cluster: Cluster): number[] {
  const isHeavy = cluster.id === 5;
  const base = cluster.avgConsumption;

  return HOURLY_SLOTS.map((_, i) => {
    const hour = i / 2;

    if (isHeavy) {
      // Scale a ~30–55 band proportional to the real average.
      const peak = Math.exp(-Math.pow((hour - 12) / 5, 2));
      const floor = base * 0.78;
      const head = base * 1.45;
      const value = floor + peak * (head - floor) + seededNoise(cluster.id, i) * (base * 0.06);
      return round(value);
    }

    const morning = Math.exp(-Math.pow((hour - 8) / 2.2, 2)) * 0.6;
    const evening = Math.exp(-Math.pow((hour - 19) / 2.5, 2)) * 1.0;
    const night = 0.35 + 0.1 * Math.sin((hour / 24) * Math.PI * 2);
    const shape = base * (night + morning + evening);
    const noise = seededNoise(cluster.id, i) * base * 0.08;
    const tilt = clusterTilt(cluster.id, hour);
    return round(Math.max(2.5, shape + noise + tilt));
  });
}

function clusterTilt(id: number, hour: number): number {
  switch (id) {
    case 0: return 0;
    case 1: return 0.6 * Math.sin(((hour - 4) / 24) * Math.PI * 2);
    case 2: return 0.9 * Math.cos(((hour - 14) / 24) * Math.PI * 2);
    case 3: return 1.3 * Math.exp(-Math.pow((hour - 17) / 3, 2));
    case 4: return 1.1 * Math.exp(-Math.pow((hour - 9) / 2, 2));
    default: return 0;
  }
}

function seededNoise(seedA: number, seedB: number): number {
  const x = Math.sin((seedA + 1) * 12.9898 + (seedB + 1) * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

// ------------------- Forecast series (synthetic) -----------------------
export interface ForecastSeries {
  readonly cluster: Cluster;
  readonly actual: (number | null)[];
  readonly forecast: (number | null)[];
  readonly bandLower: (number | null)[];
  readonly bandUpper: (number | null)[];
}

export function generateForecastSeries(cluster: Cluster): ForecastSeries {
  const full = generate24hProfile(cluster);
  const splitIdx = 24;
  const actual: (number | null)[] = full.map((v, i) => (i < splitIdx ? v : null));
  const forecast: (number | null)[] = full.map((v, i) => {
    if (i < splitIdx - 1) return null;
    if (i === splitIdx - 1) return full[i];
    const drift = seededNoise(cluster.id, i + 100) * cluster.avgConsumption * 0.07;
    return round(v + drift);
  });

  const bandLower: (number | null)[] = forecast.map((v) =>
    v === null ? null : round(v * 0.92),
  );
  const bandUpper: (number | null)[] = forecast.map((v) =>
    v === null ? null : round(v * 1.08),
  );

  return { cluster, actual, forecast, bandLower, bandUpper };
}

/** Cluster ids shown on the forecast chart (per spec). */
export const FORECAST_CLUSTER_IDS: readonly number[] = [0, 1, 2];

// ------------------- KPI presentation (static) -------------------------
export interface KpiPresentation {
  readonly label: string;
  readonly sublabel: string;
  readonly accentVar: string;
}

/**
 * Labels and accent colors for the KPI row. Actual values are computed from
 * live backend data in KpiRowComponent.
 */
export const KPI_PRESENTATION: readonly KpiPresentation[] = [
  { label: 'Households', sublabel: '', accentVar: '--kpi-green' },
  { label: 'Total Consumption', sublabel: 'kWh', accentVar: '--kpi-amber' },
  { label: 'Avg Daily Temp', sublabel: '', accentVar: '--kpi-purple' },
  { label: 'Active Clusters', sublabel: 'Identified via FastMICE', accentVar: '--kpi-cyan' },
];

// ------------------- Anomalies (no backend endpoint yet) --------------
export type AnomalySeverity = 'critical' | 'high';

export interface AnomalyItem {
  readonly id: string;
  readonly title: string;
  readonly severity: AnomalySeverity;
  readonly description: string;
  readonly deviation: number;
  readonly minutesAgo: number;
}

export const ANOMALY_ITEMS: readonly AnomalyItem[] = [
  { id: 'a1', title: 'Consumption Spike', severity: 'critical', description: 'High Demand · Meter #8305', deviation: 215, minutesAgo: 33 },
  { id: 'a2', title: 'Sustained Overload', severity: 'critical', description: 'Heavy Industrial · Meter #4127', deviation: 184, minutesAgo: 48 },
  { id: 'a3', title: 'Unexpected Dropoff', severity: 'critical', description: 'Commercial Standard · Meter #2290', deviation: 172, minutesAgo: 61 },
  { id: 'a4', title: 'Temperature Anomaly', severity: 'high', description: 'Residential Low · Meter #1044', deviation: 98, minutesAgo: 74 },
  { id: 'a5', title: 'Off-hours Usage', severity: 'high', description: 'Industrial Variable · Meter #7812', deviation: 87, minutesAgo: 112 },
  { id: 'a6', title: 'Pattern Deviation', severity: 'high', description: 'Peak Users · Meter #9914', deviation: 76, minutesAgo: 145 },
];

// ------------------- Geographic zones (no backend endpoint yet) -------
export interface GeoZone {
  readonly name: string;
  readonly dominantPercentage: number;
  readonly segments: readonly { clusterId: number; value: number }[];
}

export const GEO_ZONES: readonly GeoZone[] = [
  {
    name: 'Residential',
    dominantPercentage: 68,
    segments: [
      { clusterId: 0, value: 68 },
      { clusterId: 1, value: 18 },
      { clusterId: 4, value: 8 },
      { clusterId: 3, value: 6 },
    ],
  },
  {
    name: 'Commercial',
    dominantPercentage: 54,
    segments: [
      { clusterId: 1, value: 54 },
      { clusterId: 0, value: 22 },
      { clusterId: 3, value: 14 },
      { clusterId: 4, value: 10 },
    ],
  },
  {
    name: 'Industrial',
    dominantPercentage: 47,
    segments: [
      { clusterId: 5, value: 47 },
      { clusterId: 2, value: 33 },
      { clusterId: 3, value: 12 },
      { clusterId: 1, value: 8 },
    ],
  },
];
