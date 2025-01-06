<template>
  <div ref="canvas" style="background-color: darkgray"></div>
</template>
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import * as d3 from 'd3'
const colors = {
  green: '#719049',
  orange: '#8a401d',
  darkgrey: '#404040',
}
const data = [
  { start: 12, end: 45, dir: '+', color: colors.darkgrey },
  { start: 65, end: 90, dir: '+', color: colors.green },
  { start: 115, end: 140, dir: '+', color: colors.orange },
  { start: 190, end: 210, dir: '-', color: colors.green },
  { start: 250, end: 300, dir: '+', color: colors.darkgrey },
  { start: 330, end: 350, dir: '-', color: colors.orange },
]

const canvas = useTemplateRef('canvas')
onMounted(() => {
  const degreeToRadians = d3.scaleLinear([0, 2 * Math.PI]).domain([0, 360])
  const dim = [128, 128]
  const svg = d3
    .select(canvas.value)
    .append('svg')
    .attr('width', dim[0])
    .attr('height', dim[1])
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  svg
    .append('defs')
    .append('radialGradient')
    .attr('id', 'backgroundGradient')
    .call((g) => g.append('stop').attr('offset', '0%').attr('stop-color', 'white'))
    .call((g) => g.append('stop').attr('offset', '85%').attr('stop-color', 'white'))
    .call((g) => g.append('stop').attr('offset', '100%').attr('stop-color', '#ffffff00'))
  const g = svg.append('g').attr('transform', `translate(${dim[0] / 2},${dim[1] / 2})`)

  const barWidth = 20
  const centerRadius = dim[0] / 2 - barWidth
  const fontSize = 75

  g.append('circle')
    .attr('r', dim[0] / 2)
    .attr('fill', 'url(#backgroundGradient)')
    .attr('stroke', 'none')
    .attr('stroke-width', 3)

  g.append('circle')
    .attr('r', centerRadius)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 3)

  g.selectAll('path.body')
    .data(data)
    .join('path')
    .attr('class', 'body')
    .attr('fill', (d) => d.color)
    .attr('d', (d) =>
      d3.arc()({
        innerRadius: centerRadius - barWidth / 2,
        outerRadius: centerRadius + barWidth / 2,
        startAngle: degreeToRadians(d.start),
        endAngle: degreeToRadians(d.end),
      }),
    )
  g.append('text')
    .attr('font-size', fontSize)
    .attr('font-family', "'Trebuchet MS', sans-serif;")
    .attr('text-anchor', 'middle')
    .attr('dy', fontSize / 2 - fontSize / 6) // approximately centered
    .text('B')
  // g.selectAll('path.arrow')
  //   .data(data)
  //   .join('path')
  //   .attr('class', 'arrow')
  //   .attr('fill', (d) => d.color)
  //   .attr('d', (d) => {
  //     const innerRadius = centerRadius - barWidth / 2
  //     const outerRadius = centerRadius + barWidth / 2

  //     const start = d.dir == '+' ? d.start : d.end
  //     const dir = d.dir == '+' ? -10 : +10

  //     const innerEnd = [
  //       Math.cos(degreeToRadians(start - 90)) * innerRadius,
  //       Math.sin(degreeToRadians(start - 90)) * innerRadius,
  //     ]
  //     const outerEnd = [
  //       Math.cos(degreeToRadians(start - 90)) * outerRadius,
  //       Math.sin(degreeToRadians(start - 90)) * outerRadius,
  //     ]

  //     const point = [
  //       Math.cos(degreeToRadians(start - 90) + degreeToRadians(dir)) * centerRadius,
  //       Math.sin(degreeToRadians(start - 90) + degreeToRadians(dir)) * centerRadius,
  //     ]

  //     return `M${innerEnd[0]},${innerEnd[1]} L${point[0]},${point[1]} L${outerEnd[0]},${outerEnd[1]} L${innerEnd[0]},${innerEnd[1]}`
  //   })
})
</script>
