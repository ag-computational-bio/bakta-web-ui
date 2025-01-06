import * as d3 from 'd3'
import { mouseToRadians } from './util'

export type Coloring = {
  positive: string
  negative: string
}
export interface RadialAreaPlotGenerator {
  apply(group: d3.Selection<SVGGElement, undefined, null, undefined>): void
  title(title: string): RadialAreaPlotGenerator
  radius(px: number): RadialAreaPlotGenerator
  colors(colors: Coloring): RadialAreaPlotGenerator
  height(px: number): RadialAreaPlotGenerator
  height(): number
  transition(b: boolean): RadialAreaPlotGenerator
}

export type Coordinate = [number, number]

class RadialAreaTrack implements RadialAreaPlotGenerator {
  id: string
  scale: d3.ScaleLinear<number, number>
  data: Coordinate[]
  #radius: number
  #title: string = ''
  #colors: Coloring = {
    negative: 'darkgray',
    positive: 'lightgray',
  }
  #height = 50
  #transition = false

  constructor(id: string, scale: d3.ScaleLinear<number, number>, data: Coordinate[]) {
    this.id = id
    this.scale = scale
    this.#radius = 10
    this.data = data
  }

  height(px: number): RadialAreaPlotGenerator
  height(): number
  height(px?: number): number | RadialAreaPlotGenerator {
    if (px == undefined) return this.#height
    this.#height = px
    return this
  }
  radius(px: number): RadialAreaPlotGenerator {
    this.#radius = px
    return this
  }
  title(title: string): RadialAreaPlotGenerator {
    this.#title = title
    return this
  }

  colors(colors: Coloring): RadialAreaPlotGenerator {
    this.#colors = colors
    return this
  }
  transition(b: boolean): RadialAreaPlotGenerator {
    this.#transition = b
    return this
  }

  get apply() {
    return this._apply.bind(this)
  }

  _apply(g: d3.Selection<SVGGElement, undefined, null, undefined>) {
    const data = this.data
    const radiansScale = this.scale
    const colors = this.#colors
    const title = this.#title

    const titleSize = 8
    const titleMargin = 2
    const tickSize = 6

    const outerPlotRadius = this.#radius - titleSize - titleMargin
    const innerPlotRadius = this.#radius - this.#height
    const plotCenter = outerPlotRadius - (outerPlotRadius - innerPlotRadius) / 2

    const useTransition = this.#transition

    // the plot layers should be:
    // 1. background orientation lines (lattice)
    // 2. data
    // 3. y-axis
    // 4. x-axis
    // 5. title

    // negative and positive values should be plotted in separate colors
    // so we plot two separate areas
    const positiveData: Coordinate[] = data.map((x) => (x[1] < 0 ? [x[0], 0] : x))
    const negativeData: Coordinate[] = data.map((x) => (x[1] >= 0 ? [x[0], 0] : x))

    const posMax = d3.max(positiveData, (d) => d[1]) ?? 0
    const negMin = d3.min(negativeData, (d) => d[1]) ?? 0
    const deviationMax = d3.max([posMax, -negMin]) ?? 0

    const yScale = d3
      .scaleLinear([innerPlotRadius, outerPlotRadius])
      .domain([-deviationMax, deviationMax])
      .nice()

    let background = g.select<SVGPathElement>('path.background')
    if (background.empty()) {
      background = g.append('path')
    }
    // register mouse listener on group when the track is called the first time only
    // i.e. when the background is added the first time
    g.on('mousemove.indicator', (evt) => {
      const angle = mouseToRadians(evt)

      let helper = g.select<SVGPathElement>('path.helper')
      if (helper.empty()) helper = g.append('path').attr('class', 'helper')
      helper
        .attr(
          'd',
          d3.arc()({
            innerRadius: innerPlotRadius,
            outerRadius: outerPlotRadius,
            endAngle: angle,
            startAngle: angle,
          }),
        )
        .attr('stroke', 'lightgray')
        .attr('stroke-dasharray', '1,3')
        .style('pointer-events', 'none')
    }).on('mouseleave.indicator', () => {
      const helper = g.select<SVGPathElement>('path.helper')
      if (!helper.empty()) helper.remove()
    })
    background
      .attr('class', 'background')
      .attr('fill', '#fff0')
      .attr(
        'd',
        d3.arc()({
          innerRadius: innerPlotRadius,
          outerRadius: outerPlotRadius,
          startAngle: 0,
          endAngle: 2 * Math.PI,
        }),
      )

    // draw the background lines
    let backgroundLattice = g.select<SVGGElement>('g.lattice')
    if (backgroundLattice.empty()) backgroundLattice = g.append('g').attr('class', 'lattice')

    function updateLattice(
      g:
        | d3.Selection<SVGCircleElement, number, SVGGElement, undefined>
        | d3.Transition<SVGCircleElement, number, SVGGElement, undefined>,
    ) {
      g.attr('fill', 'none')
      g.attr('stroke', '#ddd')
      g.attr('r', (d) => yScale(d))
    }
    backgroundLattice
      .selectAll<SVGCircleElement, number>('circle')
      .data(yScale.ticks(5))
      .join(
        (enter) => enter.append('circle').call(updateLattice),
        (update) =>
          useTransition ? update.transition().call(updateLattice) : update.call(updateLattice),
      )

    // draw the data
    const area = d3
      .areaRadial()
      .curve(d3.curveLinearClosed)
      .angle((d) => radiansScale(d[0]))
    let dataEl = g.select<SVGGElement>('g.data')
    if (dataEl.empty()) dataEl = g.append('g').attr('class', 'data')

    function updateAbove(
      g:
        | d3.Selection<SVGPathElement, undefined, null, undefined>
        | d3.Transition<SVGPathElement, undefined, null, undefined>,
    ) {
      g.attr('fill', colors.negative)
      g.attr('stroke', 'none')
      g.attr('stroke-width', 1.5)
      g.attr('d', area.innerRadius((d) => yScale(d[1])).outerRadius(plotCenter)(negativeData))
    }
    let aboveEl = dataEl.select<SVGPathElement>('path.above')
    if (aboveEl.empty()) aboveEl = dataEl.append('path').attr('class', 'above').call(updateAbove)
    else if (useTransition) aboveEl.transition().call(updateAbove)
    else aboveEl.call(updateAbove)

    function updateBelow(
      g:
        | d3.Selection<SVGPathElement, undefined, null, undefined>
        | d3.Transition<SVGPathElement, undefined, null, undefined>,
    ) {
      g.attr('fill', colors.positive)
      g.attr('stroke', 'none')
      g.attr('stroke-width', 1.5)
      g.attr('d', area.outerRadius((d) => yScale(d[1])).innerRadius(plotCenter)(positiveData))
    }
    let belowEl = dataEl.select<SVGPathElement>('path.below')
    if (belowEl.empty()) belowEl = dataEl.append('path').attr('class', 'below').call(updateBelow)
    else if (useTransition) belowEl.transition().call(updateBelow)
    else belowEl.call(updateBelow)

    // draw the y-axis
    let yAxis = g.select<SVGGElement>('g.y-axis')
    if (yAxis.empty()) yAxis = g.append('g').attr('class', 'y-axis')

    function updateYAxis(
      g:
        | d3.Selection<SVGLineElement, undefined, null, undefined>
        | d3.Transition<SVGLineElement, undefined, null, undefined>,
    ) {
      g.attr('x1', 0)
      g.attr('x2', 0)
      g.attr('y1', -yScale.range()[0])
      g.attr('y2', -yScale.range()[1])
      g.attr('stroke', 'black')
    }
    let yLine = yAxis.select<SVGLineElement>('line.y')
    if (yLine.empty()) yLine = yAxis.append('line').attr('class', 'y').call(updateYAxis)
    else if (useTransition) yLine.transition().call(updateYAxis)
    else yLine.call(updateYAxis)

    function updateYAxisTick(
      g:
        | d3.Selection<SVGLineElement, number, SVGGElement, undefined>
        | d3.Transition<SVGLineElement, number, SVGGElement, undefined>,
    ) {
      g.attr('x1', 0)
      g.attr('x2', -tickSize)
      g.attr('y1', (d) => -yScale(d))
      g.attr('y2', (d) => -yScale(d))
      g.attr('stroke', 'black')
    }
    yAxis
      .selectAll<SVGLineElement, number>('line.tick')
      .data([yScale.domain()[0], yScale.domain()[1]])
      .join(
        (enter) => enter.append('line').attr('class', 'tick').call(updateYAxisTick),
        (update) =>
          useTransition ? update.transition().call(updateYAxisTick) : update.call(updateYAxisTick),
      )

    type TickLabel = { y: number; text: number }
    function updateTickLabel(
      g:
        | d3.Selection<SVGTextElement, TickLabel, SVGGElement, undefined>
        | d3.Transition<SVGTextElement, TickLabel, SVGGElement, undefined>,
    ) {
      g.attr('x', -6)
      g.attr('text-anchor', 'end')
      g.attr('y', (d) => d.y + 3)
      g.attr('font-size', 8)
      g.attr('fill', 'black')
      g.text((d) => d.text)
    }
    const labels: TickLabel[] = [
      { y: -yScale.range()[0], text: yScale.domain()[0] },
      { y: -yScale.range()[1], text: yScale.domain()[1] },
    ]
    yAxis
      .selectAll<SVGTextElement, TickLabel>('text.label')
      .data(labels)
      .join(
        (enter) => enter.append('text').attr('class', 'label').call(updateTickLabel),
        (update) =>
          useTransition ? update.transition().call(updateTickLabel) : update.call(updateTickLabel),
      )

    // draw the x-axis
    function updateXAxis(
      g:
        | d3.Selection<SVGCircleElement, undefined, null, undefined>
        | d3.Transition<SVGCircleElement, undefined, SVGGElement, undefined>,
    ) {
      g.attr('fill', 'none')
      g.attr('stroke', 'black')
      g.attr('r', plotCenter)
    }
    let xAxis = yAxis.select<SVGCircleElement>('circle.x-axis')
    if (xAxis.empty()) xAxis = yAxis.append('circle').attr('class', 'x-axis').call(updateXAxis)
    else if (useTransition) xAxis.transition().call(updateXAxis)
    else xAxis.call(updateXAxis)

    // draw the title
    function updateTitle(
      g:
        | d3.Selection<SVGTextElement, undefined, null, undefined>
        | d3.Transition<SVGTextElement, undefined, SVGGElement, undefined>,
    ) {
      g.attr('x', 0)
      g.attr('y', -yScale.range()[1] - 8)
      g.attr('text-anchor', 'middle')
      g.attr('font-size', 9)
      g.attr('fill', 'black')
      g.text(title)
    }
    let titleEl = g.select<SVGTextElement>('text.title')
    if (titleEl.empty()) titleEl = g.append('text').attr('class', 'title').call(updateTitle)
    else if (useTransition) titleEl.transition().call(updateTitle)
    else titleEl.call(updateTitle)
  }
}

/**
 * Plots the data as an 0-centered area plot on a circle with the specified radius.
 *
 * Usage:
 * const track = radialAreaTrack(clz, radiansScale, radius, data).title(title);
 * d3.select('g').call(track.apply);
 *
 * @param id A unique identifier for this track, must not contain spaces or other characters that are not allowed in css class names
 * @param scale The linear scale between [0,2pi]
 * @param radius The outer radius of the track
 * @param data The data to plot
 * @returns
 */
export function radialAreaTrack(
  id: string,
  scale: d3.ScaleLinear<number, number>,
  data: Coordinate[],
) {
  return new RadialAreaTrack(id, scale, data)
}
