<template>
  <div ref="canvas"></div>
  <div ref="canvas2"></div>
</template>
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import * as d3 from 'd3'

const length = 360
const colors = {
  black: '#000',
  green: '#0f0',
  red: '#f00',
  white: '#fff',
  grey: '#999',
  a: '#99334daa',
  b: '#0099ffaa',
  c: '#9ec928aa',
  d: '#727dccaa',
  x: '#ffcc99aa',
}
const data = {
  fwd: [
    { start: 10, end: 40, color: colors.a },
    { start: 45, end: 50, color: colors.b },
    { start: 60, end: 75, color: colors.x },
    { start: 80, end: 100, color: colors.d },
    { start: 128, end: 180, color: colors.c },
    { start: 220, end: 260, color: colors.x },
    { start: 300, end: 315, color: colors.x },
    { start: 340, end: 355, color: colors.d },
  ],
  rev: [
    { start: 2, end: 8, color: colors.d },
    { start: 53, end: 58, color: colors.x },
    { start: 77, end: 79, color: colors.x },
    { start: 101, end: 124, color: colors.d },
    { start: 190, end: 219, color: colors.a },
    { start: 265, end: 295, color: colors.c },
    { start: 320, end: 335, color: colors.a },
  ],
  other: [
    { start: 185, end: 189, color: colors.grey },
    { start: 40, end: 42, color: colors.grey },
    { start: 50, end: 53, color: colors.grey },
    { start: 90, end: 99, color: colors.grey },
  ],
}
const canvas = useTemplateRef('canvas')
const canvasLinear = useTemplateRef('canvas2')

const gcRange = d3.scaleLinear([0.4, 0.7]).domain([0, 1])
const rand = d3.randomUniform()
const gcData: [number, number][] = []
for (let i = 0; i < 360; i = i + 2) {
  gcData.push([i, gcRange(rand())])
}

function plotCirc() {
  const svg = d3
    .create('svg')
    .attr('width', 200)
    .attr('height', 200)
    .attr('version', '1.1')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
  const g = svg.append('g').attr('transform', 'translate(100,100)')
  const scale = d3.scaleLinear([0, 2 * Math.PI]).domain([0, length])
  g.append('path')
    .attr('class', 'backbone')
    .attr('d', d3.arc()({ startAngle: 0, endAngle: 360, innerRadius: 90, outerRadius: 90 }))
    .attr('stroke', colors.grey)
    .attr('stroke-width', 2)

  g.selectAll('path.feature.fwd')
    .data(data.fwd)
    .enter()
    .append('path')
    .attr('class', 'feature fwd')
    .attr('d', (x) =>
      d3.arc()({
        startAngle: scale(x.start),
        endAngle: scale(x.end),
        innerRadius: 70,
        outerRadius: 80,
      }),
    )
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)

  g.selectAll('path.feature.rev')
    .data(data.rev)
    .enter()
    .append('path')
    .attr('class', 'feature rev')
    .attr('d', (x) =>
      d3.arc()({
        startAngle: scale(x.start),
        endAngle: scale(x.end),
        innerRadius: 50,
        outerRadius: 60,
      }),
    )
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)

  const gcScale = d3.scaleLinear([20, 40]).domain([0.3, 0.8])
  const gc: [number, number][] = gcData.map((x) => [scale(x[0]), gcScale(x[1])])
  g.append('path')
    .attr('class', 'gc')
    .attr('d', d3.areaRadial().curve(d3.curveLinearClosed).innerRadius(30)(gc))
    .attr('stroke', colors.grey)
    .attr('fill', colors.grey)

  const node = svg.node()
  if (canvas.value && node) canvas.value.append(node)
}

function plotLinear() {
  const svg = d3
    .create('svg')
    .attr('width', 200)
    .attr('height', 100)
    .attr('version', '1.1')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
  const g = svg.append('g')
  const scale = d3.scaleLinear([0, 200]).domain([0, length])

  g.selectAll('rect.feature.fwd')
    .data(data.fwd)
    .enter()
    .append('rect')
    .attr('class', 'feature fwd')
    .attr('x', (d) => scale(d.start))
    .attr('width', (d) => scale(d.end - d.start))
    .attr('y', 10)
    .attr('height', 10)
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)

  g.selectAll('path.feature.rev')
    .data(data.rev)
    .enter()
    .append('rect')
    .attr('class', 'feature fwd')
    .attr('x', (d) => scale(d.start))
    .attr('width', (d) => scale(d.end - d.start))
    .attr('y', 30)
    .attr('height', 10)
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)

  g.selectAll('path.feature.other')
    .data(data.other)
    .enter()
    .append('rect')
    .attr('class', 'feature other')
    .attr('x', (d) => scale(d.start))
    .attr('width', (d) => scale(d.end - d.start))
    .attr('y', 50)
    .attr('height', 10)
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)
    .attr('stroke', (d) => d.color)
    .attr('fill', (d) => d.color)

  const node = svg.node()
  if (canvasLinear.value && node) canvasLinear.value.append(node)
}

onMounted(() => {
  plotCirc()
  plotLinear()
})
</script>
