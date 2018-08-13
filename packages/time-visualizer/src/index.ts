import * as D3 from "d3";

import * as Score from "~/score";

import * as Data from "./Data";

const DIVERGING = false;

const WIDTH = 20000;
const HEIGHT = 10;

const SAMPLE_DURATION_MS = 5 * 60 * 1000;

const data = Data.toD3StackFormat(DIVERGING, SAMPLE_DURATION_MS);

const series = D3.stack()
  .keys(Score.names.reverse())
  .order(D3.stackOrderNone)
  .offset(DIVERGING ? D3.stackOffsetNone : D3.stackOffsetExpand)(data);

const x = D3.scaleLinear()
  .domain([Data.interval.start.valueOf(), Data.interval.stop.valueOf()])
  .range([0, WIDTH]);

const y = D3.scaleLinear()
  .domain(DIVERGING ? [-7, 7] : [0, 1])
  .range([HEIGHT, 0]);

const area = D3.area()
  .x(datum => x(datum.data.startMS))
  .y0(datum => y(datum[0]))
  .y1(datum => y(datum[1]))
  .curve(D3.curveBasis);

D3.selectAll("svg").remove();

D3.select("body")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
  .attr("preserveAspectRatio", "none")
  .selectAll("path")
  .data(series)
  .enter()
  .append("path")
  .attr("d", area)
  .attr("fill", (_datum: never, index: number) => Score.colorForIndex(index));
