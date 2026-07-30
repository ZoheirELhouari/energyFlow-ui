/**
 * Single source of truth for ECharts registration.
 *
 * All chart renderers and components used across the app are imported and
 * registered here so that the ECharts bundle stays tree-shaken. Components
 * import `echarts` from this file (via NgxEchartsModule's `echarts: () => ...`
 * factory in app.config.ts) and the shared dark theme constants for styling.
 */
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from 'echarts/charts';
import {
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  MarkAreaComponent,
  MarkLineComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

export { echarts };

/**
 * Dark-mode color palette used across chart options. Values match the
 * dashboard's global CSS variables in styles.scss so charts blend with the
 * card surfaces.
 */
export const CHART_COLORS = {
  axisLine: '#1e293b',
  splitLine: '#1e293b',
  axisLabel: '#94a3b8',
  text: '#e2e8f0',
  tooltipBg: '#12121a',
  tooltipBorder: '#1e293b',
} as const;

/**
 * Shared partial EChartsOption with dark-theme defaults. Spread into chart
 * option objects, then override specific fields as needed.
 */
export const DARK_CHART_DEFAULTS = {
  backgroundColor: 'transparent',
  textStyle: {
    color: CHART_COLORS.text,
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 12,
  },
  tooltip: {
    backgroundColor: CHART_COLORS.tooltipBg,
    borderColor: CHART_COLORS.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: CHART_COLORS.text, fontSize: 12 },
  },
  legend: {
    textStyle: { color: CHART_COLORS.axisLabel, fontSize: 12 },
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 18,
  },
} as const;

/** Default axis styling for dark-theme cartesian charts. */
export const DARK_AXIS = {
  axisLine: { lineStyle: { color: CHART_COLORS.axisLine } },
  axisTick: { show: false },
  axisLabel: { color: CHART_COLORS.axisLabel, fontSize: 11 },
  splitLine: { lineStyle: { color: CHART_COLORS.splitLine, type: 'dashed' } },
} as const;
