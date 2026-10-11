<template>
  <div class="time-chart">
    <div v-if="series.length > 1" class="legend mb-2">
      <span v-for="s in series" :key="s.key" class="legend-item">
        <span class="swatch" :class="{ line: kind === 'lines' }" :style="swatchStyle(s)"></span
        >{{ s.label }}
      </span>
    </div>
    <div ref="container" class="plot">
      <svg ref="svg" :width="width" :height="height" role="img" :aria-label="label"></svg>
      <div
        v-if="hover"
        class="chart-tooltip"
        :style="{ left: `${hover.x}px`, transform: hover.flip ? 'translateX(-100%)' : 'none' }"
      >
        <div class="fw-semibold mb-1">{{ labels[hover.index] }}</div>
        <div
          v-for="s in tooltipSeries(hover.index)"
          :key="s.key"
          class="d-flex align-items-center gap-2"
        >
          <span class="swatch" :style="swatchStyle(s)"></span>
          <span class="flex-grow-1">{{ s.label }}</span>
          <span class="fw-semibold">{{ format(valueAt(s.key, hover.index)) }}</span>
        </div>
        <div v-if="kind === 'bars' && series.length > 1" class="d-flex gap-2 mt-1 pt-1 total">
          <span class="flex-grow-1">Total</span>
          <span class="fw-semibold">{{ format(total(hover.index)) }}</span>
        </div>
        <div v-if="notes?.[hover.index]" class="mt-1 pt-1 total">{{ notes[hover.index] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { ChartSeries } from '../chart-colors'

/*
 * A small chart over periods or buckets: stacked bars for counts, lines for
 * durations over time, or dots for values per bucket.
 * values[key][i] is the value of series "key" at label i, null for no data.
 */
const props = defineProps<{
  kind: 'bars' | 'lines' | 'dots'
  // the label of each column in the tooltip
  labels: string[]
  // shorter labels for the x axis, by default the labels
  tickLabels?: string[]
  // an extra line per column in the tooltip
  notes?: string[]
  series: ChartSeries[]
  values: Record<string, (number | null)[]>
  format: (value: number | null) => string
  // labels of the y axis, by default like the values
  axisFormat?: (value: number) => string
  label: string
}>()

const container = ref<HTMLElement>()
const svg = ref<SVGSVGElement>()
const width = ref(600)
const height = 260
const margin = { top: 8, right: 8, bottom: 28, left: 64 }
const hover = ref<{ index: number; x: number; flip: boolean }>()

// bars have a light fill and a stronger outline, lines and dots one strong color
function swatchStyle(s: ChartSeries) {
  if (props.kind !== 'bars') return { backgroundColor: s.color }
  return { backgroundColor: s.color, border: `1px solid ${s.stroke ?? s.color}` }
}

function valueAt(key: string, index: number): number | null {
  return props.values[key]?.[index] ?? null
}

// the tooltip of a bar leaves out empty groups
function tooltipSeries(index: number): ChartSeries[] {
  if (props.kind !== 'bars') return props.series
  const shown = props.series.filter((s) => valueAt(s.key, index))
  return shown.length ? shown : props.series
}

function total(index: number): number {
  return props.series.reduce((sum, s) => sum + (valueAt(s.key, index) ?? 0), 0)
}

function draw() {
  if (!svg.value) return
  const root = d3.select(svg.value)
  root.selectAll('*').remove()
  const w = width.value - margin.left - margin.right
  const h = height - margin.top - margin.bottom
  const n = props.labels.length
  const x = d3
    .scaleBand<number>()
    .domain(d3.range(n))
    .range([0, w])
    .padding(props.kind === 'bars' ? 0.2 : 0)
  const max =
    props.kind === 'bars'
      ? (d3.max(d3.range(n), total) ?? 0)
      : (d3.max(
          props.series.flatMap((s) => props.values[s.key] ?? []),
          (v) => v ?? 0,
        ) ?? 0)
  const y = d3
    .scaleLinear()
    .domain([0, max || 1])
    .nice(4)
    .range([h, 0])
  const g = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // grid lines and y labels
  const ticks = y.ticks(4)
  g.selectAll('line.grid')
    .data(ticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', w)
    .attr('y1', (t) => y(t))
    .attr('y2', (t) => y(t))
  g.selectAll('text.y-label')
    .data(ticks)
    .join('text')
    .attr('class', 'axis-label y-label')
    .attr('x', -8)
    .attr('y', (t) => y(t))
    .attr('dy', '0.32em')
    .attr('text-anchor', 'end')
    .text((t) => (props.axisFormat ?? props.format)(t))

  // x labels: as many as fit, estimated from the longest label
  const xTicks = props.tickLabels ?? props.labels
  const half = (d3.max(xTicks, (t) => t.length) ?? 0) * 3.3
  const step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(w / (2 * half + 16)))))
  const center = (i: number) => (x(i) ?? 0) + x.bandwidth() / 2
  g.selectAll('text.x-label')
    // labels that would stick out of the chart are left out
    .data(
      d3
        .range(0, n, step)
        .filter((i) => center(i) - half > -margin.left && center(i) + half < w + margin.right),
    )
    .join('text')
    .attr('class', 'axis-label x-label')
    .attr('x', center)
    .attr('y', h + 18)
    .attr('text-anchor', 'middle')
    .text((i) => xTicks[i])

  const highlight = g
    .append('rect')
    .attr('class', 'hover-band')
    .attr('y', 0)
    .attr('height', h)
    .attr('width', Math.max(1, x.step()))
    .style('display', 'none')

  if (props.kind === 'bars') {
    const stacked = d3
      .stack<number>()
      .keys(props.series.map((s) => s.key))
      .value((i, key) => valueAt(key, i) ?? 0)(d3.range(n))
    const wide = x.bandwidth() > 6
    g.selectAll('g.series')
      .data(stacked)
      .join('g')
      .style('fill', (_, i) => props.series[i].color)
      .style('stroke', (_, i) => props.series[i].stroke ?? props.series[i].color)
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => x(d.data) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr('class', wide ? 'segment' : 'segment narrow')
  } else {
    for (const s of props.series) {
      const line = d3
        .line<number>()
        .defined((i) => valueAt(s.key, i) != null)
        .x((i) => (x(i) ?? 0) + x.bandwidth() / 2)
        .y((i) => y(valueAt(s.key, i) ?? 0))
        .curve(d3.curveMonotoneX)
      if (props.kind === 'lines') {
        g.append('path')
          .attr('class', 'line')
          .style('stroke', s.color)
          .attr('d', line(d3.range(n)))
      }
      if (n <= 40 || props.kind === 'dots') {
        g.selectAll(null)
          .data(d3.range(n).filter((i) => valueAt(s.key, i) != null))
          .join('circle')
          .attr('class', 'point')
          .attr('r', 4)
          .attr('cx', (i) => (x(i) ?? 0) + x.bandwidth() / 2)
          .attr('cy', (i) => y(valueAt(s.key, i) ?? 0))
          .style('fill', s.color)
      }
    }
  }

  // hover targets as large as the whole column
  g.append('rect')
    .attr('width', w)
    .attr('height', h)
    .style('fill', 'transparent')
    .on('mousemove', (event: MouseEvent) => {
      const [px] = d3.pointer(event)
      const index = Math.min(n - 1, Math.max(0, Math.floor(px / x.step())))
      highlight.style('display', null).attr('x', index * x.step())
      const cx = margin.left + (x(index) ?? 0) + x.bandwidth() / 2
      hover.value = { index, x: cx + (cx > width.value / 2 ? -12 : 12), flip: cx > width.value / 2 }
    })
    .on('mouseleave', () => {
      highlight.style('display', 'none')
      hover.value = undefined
    })
}

let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = Math.max(320, Math.floor(entry.contentRect.width))
  })
  if (container.value) observer.observe(container.value)
  draw()
})
onUnmounted(() => observer?.disconnect())
watch([() => props.values, () => props.series, () => props.labels, width], draw, {
  flush: 'post',
})
</script>

<style scoped>
.plot {
  position: relative;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: var(--bakta-font-size-sm);
  color: var(--bs-secondary-color);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.swatch {
  display: inline-block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 2px;
}
.swatch.line {
  height: 2px;
  width: 1rem;
}
.chart-tooltip {
  position: absolute;
  top: 0;
  z-index: 10;
  min-width: 12rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--bs-border-radius-sm);
  background-color: var(--bakta-tooltip-bg);
  color: var(--bs-white);
  font-size: var(--bakta-font-size-sm);
  pointer-events: none;
}
.chart-tooltip .total {
  border-top: 1px solid rgba(var(--bs-white-rgb), 0.2);
}
.plot :deep(.grid) {
  stroke: var(--bs-border-color);
}
.plot :deep(.axis-label) {
  fill: var(--bs-secondary-color);
  font-size: var(--bakta-font-size-xs);
}
.plot :deep(.hover-band) {
  fill: var(--bakta-surface);
}
.plot :deep(.segment) {
  stroke-width: 1px;
}
/* very narrow bars would be only outline, they keep the fill alone */
.plot :deep(.segment.narrow) {
  stroke-width: 0;
}
.plot :deep(.line) {
  fill: none;
  stroke-width: 2px;
}
.plot :deep(.point) {
  stroke: var(--bs-body-bg);
  stroke-width: 2px;
}
</style>
