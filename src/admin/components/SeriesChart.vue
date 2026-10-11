<template>
  <div class="time-chart">
    <div v-if="series.length > 1" class="legend mb-2">
      <span v-for="s in ordered" :key="s.key" class="legend-item">
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
        <div
          v-if="kind === 'bars' && tooltipSeries(hover.index).length > 1"
          class="d-flex gap-2 mt-1 pt-1 total"
        >
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ChartSeries } from '../chart-colors'
import { pointIndexes } from '../chart-data'

/*
 * A small chart over periods or buckets: stacked bars for counts, lines for
 * durations over time, dots for values per bucket, or ranges from a median up
 * to a p90 per bucket.
 * values[key][i] is the value of series "key" at label i, null for no data.
 */
const props = defineProps<{
  // ranges: a dot for the first series and a thin line up to the second
  kind: 'bars' | 'lines' | 'dots' | 'ranges'
  // the label of each column in the tooltip
  labels: string[]
  // shorter labels for the x axis, by default the labels
  tickLabels?: string[]
  // an extra line per column in the tooltip
  notes?: string[]
  // a second, smaller line under each x label, like "n = 12"
  subLabels?: string[]
  // the jobs counted for each column: points of fewer than 3 jobs are drawn hollow
  counts?: (number | null)[]
  // the title of the y axis, like "Jobs" or "Minutes"
  yTitle?: string
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
const baseMargin = { top: 8, right: 8, bottom: 28, left: 72 }
// values of fewer counted jobs than this are not reliable, their points are hollow
const fewJobs = 3

// stacked bars list the top of the stack first, like they are drawn
const ordered = computed(() => (props.kind === 'bars' ? [...props.series].reverse() : props.series))
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
  const shown = ordered.value.filter((s) => valueAt(s.key, index))
  return shown.length ? shown : ordered.value
}

function few(index: number): boolean {
  const count = props.counts?.[index]
  return count != null && count < fewJobs
}

function total(index: number): number {
  return props.series.reduce((sum, s) => sum + (valueAt(s.key, index) ?? 0), 0)
}

function draw() {
  if (!svg.value) return
  const root = d3.select(svg.value)
  root.selectAll('*').remove()
  const n = props.labels.length
  // x labels: all of them for a few buckets, turned when they do not fit side by side
  const xTicks = props.tickLabels ?? props.labels
  const half = (d3.max(xTicks, (t) => t.length) ?? 0) * 3.3
  const roughStep = (width.value - baseMargin.left - baseMargin.right) / Math.max(1, n)
  const rotate = n <= 12 && 2 * half + 8 > roughStep
  const margin = {
    ...baseMargin,
    bottom: baseMargin.bottom + (rotate ? half : 0) + (props.subLabels ? 14 : 0),
  }
  const w = width.value - margin.left - margin.right
  const h = height - margin.top - margin.bottom
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
  if (props.yTitle) {
    g.append('text')
      .attr('class', 'axis-label axis-title')
      .attr('transform', `translate(${-margin.left + 12},${h / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text(props.yTitle)
  }

  // x labels: for many periods as many as fit, estimated from the longest label
  const step = rotate ? 1 : Math.max(1, Math.ceil(n / Math.max(1, Math.floor(w / (2 * half + 16)))))
  const center = (i: number) => (x(i) ?? 0) + x.bandwidth() / 2
  const shown = d3
    .range(0, n, step)
    // labels that would stick out of the chart are left out
    .filter(
      (i) => rotate || (center(i) - half > -margin.left && center(i) + half < w + margin.right),
    )
  g.selectAll('text.x-label')
    .data(shown)
    .join('text')
    .attr('class', 'axis-label x-label')
    .attr('transform', (i) =>
      rotate
        ? `translate(${center(i)},${h + 14}) rotate(-35)`
        : `translate(${center(i)},${h + 18})`,
    )
    .attr('text-anchor', rotate ? 'end' : 'middle')
    .text((i) => xTicks[i])
  if (props.subLabels) {
    g.selectAll('text.x-sub-label')
      .data(shown)
      .join('text')
      .attr('class', 'axis-label x-sub-label')
      .attr('x', center)
      .attr('y', h + margin.bottom - 6)
      .attr('text-anchor', 'middle')
      .text((i) => props.subLabels?.[i] ?? '')
  }

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
  } else if (props.kind === 'ranges') {
    // a thin line from the first series (the median) up to the second (p90), a dot on the first
    const [low, high] = props.series
    const cx = (i: number) => (x(i) ?? 0) + x.bandwidth() / 2
    const has = (key: string | undefined) => (i: number) => !!key && valueAt(key, i) != null
    g.selectAll('line.range')
      .data(d3.range(n).filter((i) => has(low?.key)(i) && has(high?.key)(i)))
      .join('line')
      .attr('class', 'range')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', (i) => y(valueAt(low.key, i) ?? 0))
      .attr('y2', (i) => y(valueAt(high.key, i) ?? 0))
      .style('stroke', high?.color ?? low?.color)
    g.selectAll('line.range-end')
      .data(d3.range(n).filter(has(high?.key)))
      .join('line')
      .attr('class', 'range-end')
      .attr('x1', (i) => cx(i) - 6)
      .attr('x2', (i) => cx(i) + 6)
      .attr('y1', (i) => y(valueAt(high.key, i) ?? 0))
      .attr('y2', (i) => y(valueAt(high.key, i) ?? 0))
      .style('stroke', high?.color)
    g.selectAll('circle.point')
      .data(d3.range(n).filter(has(low?.key)))
      .join('circle')
      .attr('class', (i) => (few(i) ? 'point hollow' : 'point'))
      .attr('r', 5)
      .attr('cx', cx)
      .attr('cy', (i) => y(valueAt(low.key, i) ?? 0))
      .style('fill', (i) => (few(i) ? null : low.color))
      .style('stroke', (i) => (few(i) ? low.color : null))
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
      // isolated values are not part of a line, they always get a point, and so do
      // values of few jobs, drawn hollow
      const values = d3.range(n).map((i) => valueAt(s.key, i))
      const points = pointIndexes(values, n <= 40 || props.kind === 'dots')
      const extra = d3.range(n).filter((i) => values[i] != null && few(i) && !points.includes(i))
      g.selectAll(null)
        .data([...points, ...extra])
        .join('circle')
        .attr('class', (i) => (few(i) ? 'point hollow' : 'point'))
        .attr('r', 4)
        .attr('cx', (i) => (x(i) ?? 0) + x.bandwidth() / 2)
        .attr('cy', (i) => y(valueAt(s.key, i) ?? 0))
        .style('fill', (i) => (few(i) ? null : s.color))
        .style('stroke', (i) => (few(i) ? s.color : null))
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
watch(
  [() => props.values, () => props.series, () => props.labels, () => props.counts, width],
  draw,
  {
    flush: 'post',
  },
)
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
.plot :deep(.point.hollow) {
  fill: var(--bs-body-bg);
  stroke-width: 1.5px;
}
.plot :deep(.range),
.plot :deep(.range-end) {
  stroke-width: 1.5px;
}
.plot :deep(.axis-title) {
  font-weight: 600;
}
</style>
