import _ from "lodash";
import * as D3 from "d3";

import * as Score from "~/score";

import * as Data from "./Data";

const WIDTH = 2000;
const HEIGHT = 10;

const SAMPLE_DURATION_MS = 2 * 60 * 1000;

const data = Data.toD3StackFormat(SAMPLE_DURATION_MS);

const x = D3.scaleLinear()
  .domain([Data.interval.start.valueOf(), Data.interval.stop.valueOf()])
  .range([0, WIDTH]);

const y = D3.scaleLinear()
  .domain([0, 10])
  .range([HEIGHT, 0]);

const area = D3.area()
  .x(datum => x(datum.data.startMS))
  .y0(datum => y(datum[0]))
  .y1(datum => y(datum[1]))
  .curve(D3.curveBasis);

D3.selectAll("svg").remove();

const addChart = (data: any, positiveScores: boolean) => {
  const series = D3.stack()
    .keys(
      positiveScores
        ? [
            Score.Name.POSITIVE_LOW,
            Score.Name.POSITIVE_MEDIUM,
            Score.Name.POSITIVE_HIGH
          ]
        : [
            Score.Name.NEGATIVE_LOW,
            Score.Name.NEGATIVE_MEDIUM,
            Score.Name.NEGATIVE_HIGH
          ]
    )
    .order(D3.stackOrderNone)
    .offset(D3.stackOffsetNone)(_.clone(data));

  const background = Score.colorForName(
    positiveScores ? Score.Name.POSITIVE_HIGH : Score.Name.NEGATIVE_HIGH
  )
    .replace("rgb", "rgba")
    .replace(")", ", 0.2)");

  D3.select(positiveScores ? ".positive" : ".negative")
    .attr("style", `background: ${background}`)
    .append("svg")
    .attr("width", WIDTH)
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
    .attr("preserveAspectRatio", "none")
    .selectAll("path")
    .data(series)
    .enter()
    .append("path")
    .attr("d", area)
    .attr("fill", (_datum: never, index: number) =>
      Score.colorForIndex(positiveScores ? 2 - index : index + 4)
    );
};

addChart(data, true);
addChart(data, false);
