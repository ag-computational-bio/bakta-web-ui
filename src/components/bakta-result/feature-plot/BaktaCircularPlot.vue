<template>
  <div ref="canvas"></div>
  <div
    ref="tooltip"
    style="
      position: fixed;
      background-color: white;
      border: black solid 1px;
      padding: 0.3rem;
      display: none;
      z-index: 4000;
    "
  >
    <template v-if="highlight">
      <GcTooltip v-if="'mean' in highlight" :data="highlight" />
      <FeatureTooltip v-else :feature="highlight" />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { Feature, Sequence } from '@/model/result-data'
import * as d3 from 'd3'
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import { formatGc } from './formatters'
import baktaHelper from './bakta-helper'
import { featureTrack } from './circluar-plot/feature-track'
import { bpScale, formatBp } from './circluar-plot/formatters'
import { radialAreaTrack } from './circluar-plot/radial-area-track'
import { radialAxis } from './circluar-plot/radial-axis'
import { findPosition } from './circluar-plot/util'
import { lookupFeatureColor } from './feature-colors'
import { calcGcContent, calcGcSkew, type SlidingWindowResult } from './gc-content'
import type { GcSkewTooltipData, GcTooltipData } from './tooltip/GcTooltip.vue'
import GcTooltip from './tooltip/GcTooltip.vue'
import FeatureTooltip from './tooltip/FeatureTooltip.vue'

export type Dimensions = {
  width: number
  height: number
}
const props = withDefaults(
  defineProps<{
    sequence: Sequence
    features: Feature[]
    size?: Dimensions
  }>(),
  {
    size: () => ({
      width: 1000,
      height: 1000,
    }),
  },
)

let svg: d3.Selection<SVGSVGElement, undefined, null, undefined>
let plotG: d3.Selection<SVGGElement, undefined, null, undefined> | undefined
let zoom: d3.ZoomBehavior<Element, unknown> | undefined

/**
 * Main scale for most circular positioning in radians
 */
let radiansScale: d3.ScaleLinear<number, number, never>

function createOrGetGroup(
  parent: d3.Selection<SVGGElement, undefined, null, undefined>,
  clz: string,
  handler?: (evt: MouseEvent) => void,
): d3.Selection<SVGGElement, undefined, null, undefined> {
  let group = parent.select<SVGGElement>(`g.${clz}`)
  if (group.empty()) {
    group = parent.append('g').attr('class', clz)
    if (handler) group.on('mousemove', handler).on('mouseenter', handler).on('mouseleave', handler)
  }

  return group
}

function fitId(id: string, mode: 'infix' | 'suffix' | 'prefix' | 'none' | 'multiline'): string[] {
  const maxlen = 25
  if (id.length > maxlen) {
    if (mode === 'infix') {
      const toRemove = id.length - maxlen
      const toKeep = Math.floor((id.length - toRemove) / 2)
      return [id.substring(0, toKeep) + '[...]' + id.substring(id.length - toKeep)]
    } else if (mode === 'suffix') {
      return [id.substring(0, maxlen) + '[...]']
    } else if (mode === 'prefix') {
      return ['[...]' + id.substring(id.length - maxlen)]
    } else if (mode === 'multiline') {
      const split = []
      for (let i = 0; i < id.length; i = i + maxlen) {
        split.push(id.substring(i, Math.min(id.length, i + maxlen)))
      }
      return split
    } else {
      return [id]
    }
  }
  return [id]
}

function updateTitle(seq: Sequence, svg: d3.Selection<SVGGElement, undefined, null, undefined>) {
  let sel = svg.selectAll<SVGTSpanElement, string>('g.title > text > tspan')
  if (sel.empty()) sel = svg.append('g').attr('class', 'title').append('text').selectAll('tspan')
  const id = fitId(seq.id, 'multiline')
  const lines = [...id, formatBp(seq.length, 'bp'), 'GC: ' + formatGc(plotData.value.gc.mean)]
  sel
    .data(lines)
    .join('tspan')
    .attr('text-anchor', 'middle')
    .attr('dy', (d, i) => (i == 0 ? `0em` : `1.2em`))
    .attr('x', '0')
    .text((d) => d)
}

type Coordinate = [number, number]
type DeviationSlidingWindowResult = SlidingWindowResult & {
  deviation: Coordinate[]
}

function calcGcDistribution(seq: Sequence) {
  const res = calcGcContent(seq.nt, 1440, true)
  return {
    ...res,
    deviation: res.data.map((x) => [x[0], x[1] - res.mean] as Coordinate),
  }
}

function calcGcSkewDistribution(seq: Sequence) {
  return calcGcSkew(seq.nt, 1440, true)
}
type PlotData = {
  sequence: Sequence
  features: {
    all: Feature[]
    cdsFwd: Feature[]
    cdsRev: Feature[]
    other: Feature[]
  }
  gc: DeviationSlidingWindowResult
  gcSkew: SlidingWindowResult
}

const plotData = ref<PlotData>({
  sequence: baktaHelper.createSequence(),
  features: {
    all: [],
    cdsFwd: [],
    cdsRev: [],
    other: [],
  },
  gc: calcGcDistribution(baktaHelper.createSequence()),
  gcSkew: calcGcSkewDistribution(baktaHelper.createSequence()),
})

function computePlotData(sequence: Sequence, features: Feature[]): PlotData {
  return {
    sequence: sequence,
    features: {
      all: features,
      cdsFwd: features.filter((x) => x.type === 'cds' && x.strand === '+'),
      cdsRev: features.filter((x) => x.type === 'cds' && x.strand === '-'),
      other: features.filter((x) => x.type !== 'cds'),
    },
    gc: calcGcDistribution(sequence),
    gcSkew: calcGcSkewDistribution(sequence),
  }
}

const highlight = ref<Feature | GcTooltipData | GcSkewTooltipData>()
const tooltipEl = useTemplateRef('tooltip')

function updateTooltip(f: Feature | GcTooltipData | GcSkewTooltipData | undefined, evt: any) {
  highlight.value = f
  const [x, y] = [evt.clientX, evt.clientY]
  updateTooltipPosition(x, y, f != undefined)
}

function updateTooltipPosition(x: number, y: number, visible: boolean) {
  if (tooltipEl.value) {
    const tooltip = d3.select(tooltipEl.value)
    const node = tooltip.node()
    if (node == null) return
    const tooltipWidth = node.offsetWidth
    const tooltipHeight = node.offsetHeight

    const posX = x + tooltipWidth > window.innerWidth ? x - tooltipWidth : x
    const posY = y + tooltipHeight > window.innerHeight ? y - tooltipHeight : y
    d3.select(tooltipEl.value)
      .style('left', posX + 5 + 'px')
      .style('top', posY + 5 + 'px')
      .style('display', visible ? 'block' : 'none')
  }
}

function updatePlot(immediately: boolean) {
  function updateSvg(
    g:
      | d3.Selection<SVGSVGElement, undefined, null, undefined>
      | d3.Transition<SVGSVGElement, undefined, null, undefined>,
  ) {
    g.attr('width', props.size.width)
    g.attr('height', props.size.height)
    g.attr('style', 'max-width: 100%; height: auto;')
  }
  function handleZoom(e: d3.D3ZoomEvent<SVGSVGElement, undefined>) {
    if (plotG) plotG.attr('transform', e.transform.toString())
  }
  if (zoom === undefined) {
    zoom = d3.zoom().on('zoom', handleZoom)
  }
  if (svg == undefined) {
    svg = d3
      .create('svg')
      .call(updateSvg)
      .call(zoom as any)
  } else if (immediately) svg.call(updateSvg)
  else svg.transition().call(updateSvg)

  radiansScale = d3.scaleLinear([0, 2 * Math.PI]).domain([0, props.sequence.length])

  plotG = svg.select('g')
  if (plotG.empty()) plotG = svg.append('g')

  function configureBackground(
    g:
      | d3.Selection<SVGCircleElement, undefined, null, undefined>
      | d3.Transition<SVGCircleElement, undefined, null, undefined>,
  ) {
    g.attr('class', 'background')
    g.attr('fill', 'white')
    g.attr('r', props.size.width / 2)
  }
  let background = plotG.select<SVGCircleElement>('circle.background')
  if (background.empty()) background = plotG.append('circle').call(configureBackground)
  else if (immediately) background.call(configureBackground)
  else background.transition().call(configureBackground)

  const axis = radialAxis(radiansScale, props.size.width / 2).tickFormat((x, r) =>
    formatBp(x, bpScale(r[1])),
  )

  const featureColor = (f: Feature) => baktaHelper.lookupCogColorForFeature(f)
  const features = createOrGetGroup(plotG, 'features')
  const cdsFwdTrack = featureTrack('cdsFwd', radiansScale, plotData.value.features.cdsFwd)
    .height(25)
    .color(featureColor)
    .onHighlight(updateTooltip)
  const cdsRevTrack = featureTrack('cdsRev', radiansScale, plotData.value.features.cdsRev)
    .height(25)
    .color(featureColor)
    .onHighlight(updateTooltip)

  const otherCdsTrack = featureTrack('cdsOther', radiansScale, plotData.value.features.other)
    .height(25)
    .stroke(lookupFeatureColor)
    .color(lookupFeatureColor)
    .onHighlight(updateTooltip)
  const gcTrack = radialAreaTrack('gc', radiansScale, plotData.value.gc.deviation)
    .title('GC content')
    .height(80)
    .colors({ positive: '#17becf', negative: '#bcbd22' })
  const gcSkewTrack = radialAreaTrack('gc-skew', radiansScale, plotData.value.gcSkew.data)
    .title('GC skew')
    .height(80)
    .colors({ positive: '#fb9a99', negative: '#cab2d6' })

  let radius = props.size.width / 2
  createOrGetGroup(plotG, 'ruler').call(axis.apply)

  // Track height is provided in percent, to have a similar plot regarding how large
  // the svg is set. The only track with a fixed height ist the ruler axis. All other
  // track are distributed respective to the remaining radius.
  const availableHeight = radius - axis.height()
  const trackMargin = availableHeight * 0.03

  radius = radius - axis.height() - trackMargin
  features.call(cdsFwdTrack.radius(radius).height(0.05 * availableHeight).apply)
  radius = radius - cdsFwdTrack.height() - trackMargin
  features.call(cdsRevTrack.radius(radius).height(0.05 * availableHeight).apply)
  radius = radius - cdsRevTrack.height() - trackMargin
  features.call(otherCdsTrack.radius(radius).height(0.05 * availableHeight).apply)
  radius = radius - otherCdsTrack.height() - trackMargin
  createOrGetGroup(plotG, 'gc', (evt) => {
    if (evt.type === 'mouseenter' || evt.type === 'mousemove') {
      const gc = plotData.value.gc
      const pos = findPosition(evt, radiansScale, gc.deviation)
      if (pos >= 0 && pos < gc.data.length) {
        const event: GcTooltipData = {
          type: 'gc',
          mean: gc.mean,
          pos: [gc.data[pos][0] - gc.windowSize, gc.data[pos][0] + gc.windowSize],
          value: gc.data[pos][1],
          deviation: gc.deviation[pos][1],
        }
        updateTooltip(event, evt)
      }
    } else {
      updateTooltip(undefined, evt)
    }
  }).call(gcTrack.radius(radius).height(0.2 * availableHeight).apply)
  radius = radius - gcTrack.height() - 2 * trackMargin
  createOrGetGroup(plotG, 'gc-skew', (evt) => {
    if (evt.type === 'mouseenter' || evt.type === 'mousemove') {
      const skew = plotData.value.gcSkew
      const pos = findPosition(evt, radiansScale, skew.data)
      if (pos >= 0 && pos < skew.data.length) {
        const event: GcSkewTooltipData = {
          type: 'gc-skew',
          mean: skew.mean,
          pos: [skew.data[pos][0] - skew.windowSize, skew.data[pos][0] + skew.windowSize],
          value: skew.data[pos][1],
        }
        updateTooltip(event, evt)
      }
    } else {
      updateTooltip(undefined, evt)
    }
  }).call(gcSkewTrack.radius(radius).height(0.2 * availableHeight).apply)
  radius = radius - gcSkewTrack.height() - 4 * trackMargin
  updateTitle(props.sequence, plotG)

  return svg
}

function zoomToCenter() {
  if (svg && zoom) {
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity.translate(props.size.width / 2, props.size.height / 2),
    )
  }
}

const canvas = useTemplateRef('canvas')
onMounted(() => {
  plotData.value = computePlotData(props.sequence, props.features)
  const _svg = updatePlot(true)
  zoomToCenter()
  const n = _svg.node()
  if (n && canvas.value) canvas.value.append(n)
})
watch(
  () => [props.features, props.sequence, props.size],
  () => {
    plotData.value = computePlotData(props.sequence, props.features)
    updatePlot(true)
    zoomToCenter()
  },
)
</script>
