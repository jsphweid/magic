import _ from "lodash";
import * as D3 from "d3";

import * as Time from "~/time";

import * as Data from "./Data";
import * as Color from "./Color";

const WIDTH = 500;
const HEIGHT = 10;

const SAMPLE_DURATION_MS = 1 * 60 * 1000;

const xAxis = (
  interval: Time.Interval.Complete,
  stackData: Data.D3StackDatum[]
): D3.ScaleLinear<number, number> => {
  const { startMS: xMax } = _.last(stackData) || {
    startMS: interval.stop.valueOf()
  };

  return D3.scaleLinear()
    .domain([interval.start.valueOf(), xMax])
    .range([0, WIDTH]);
};

const yAxis = (): D3.ScaleLinear<number, number> =>
  D3.scaleLinear()
    .domain([0, 10])
    .range([HEIGHT, 0]);

const area = (
  x: D3.ScaleLinear<number, number>,
  y: D3.ScaleLinear<number, number>
) =>
  D3.area<D3.SeriesPoint<Data.D3StackDatum>>()
    .x(datum => x(datum.data.startMS))
    .y0(datum => y(datum[0]))
    .y1(datum => y(datum[1]))
    .curve(D3.curveBasis);

(async () => {
  D3.selectAll("svg").remove();

  const { interval, stackData } = await Data.asD3Stack(SAMPLE_DURATION_MS);

  const x = xAxis(interval, stackData);
  const y = yAxis();

  const renderGraph = (positiveScores: boolean) => {
    const series = D3.stack<Data.D3StackDatum>()
      .keys(
        positiveScores
          ? [
              Time.Score.Name.POSITIVE_LOW,
              Time.Score.Name.POSITIVE_MEDIUM,
              Time.Score.Name.POSITIVE_HIGH
            ]
          : [
              Time.Score.Name.NEGATIVE_LOW,
              Time.Score.Name.NEGATIVE_MEDIUM,
              Time.Score.Name.NEGATIVE_HIGH
            ]
      )
      .order(D3.stackOrderNone)
      .offset(D3.stackOffsetNone)(stackData);

    const backgroundRGB = Color.forScoreName(
      positiveScores
        ? Time.Score.Name.POSITIVE_HIGH
        : Time.Score.Name.NEGATIVE_HIGH
    )
      .replace("rgb", "rgba")
      .replace(")", ", 0.4)");

    D3.select(positiveScores ? ".positive" : ".negative")
      .attr("style", `background: ${backgroundRGB}`)
      .append("svg")
      .attr("width", WIDTH)
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
      .attr("preserveAspectRatio", "none")
      .selectAll("path")
      .data(series)
      .enter()
      .append("path")
      .attr("d", area(x, y))
      .attr("fill", (_datum, index) =>
        Color.forScoreNameIndex(positiveScores ? 2 - index : index + 4)
      );
  };

  renderGraph(true);
  renderGraph(false);
})();
