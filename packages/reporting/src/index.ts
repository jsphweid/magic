import _ from "lodash";
import Moment from "moment";
import * as D3 from "d3";
import ApolloClient from "apollo-boost";

import * as Operation from "~/operation";
import * as Time from "~/time";

import * as Data from "./Data";

const client = new ApolloClient({ uri: "http://localhost:4000" });

const WIDTH = 500;
const HEIGHT = 10;

const SAMPLE_DURATION_MS = 1 * 60 * 1000;

(async () => {
  const { data: rawData } = await client.query<Data.Data>({
    query: Operation.now
  });

  const data = Data.toD3Stack(rawData, SAMPLE_DURATION_MS);

  const paddingMinutes = 0;

  const { start, stop } = rawData.now.interval;
  const interval = {
    start: Moment(start).subtract(paddingMinutes, "minutes"),
    stop: Moment(stop || undefined).add(paddingMinutes, "minutes")
  };

  const { startMS: xMax } = _.last(data) || {
    startMS: interval.stop.valueOf()
  };

  const x = D3.scaleLinear()
    .domain([interval.start.valueOf(), xMax])
    .range([0, WIDTH]);

  const y = D3.scaleLinear()
    .domain([0, 15])
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
      .offset(D3.stackOffsetNone)(_.clone(data));

    const background = colorForName(
      positiveScores
        ? Time.Score.Name.POSITIVE_HIGH
        : Time.Score.Name.NEGATIVE_HIGH
    )
      .replace("rgb", "rgba")
      .replace(")", ", 0.4)");

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
        colorForIndex(positiveScores ? 2 - index : index + 4)
      );
  };

  addChart(data, true);
  addChart(data, false);
})();

const colorForName = (score: Time.Score.Name | string): string =>
  colorInterpolation(colorStops[Time.Score.nameFromString(score)]) as any;

const colorForIndex = (index: number): string =>
  colorForName(Time.Score.names[index]);

const colors = [
  "hsl(350, 97%, 62%)",
  "hsl(65, 100%, 51%)",
  "hsl(150, 97%, 62%)"
];

const colorStops: Time.Score.Values = {
  [Time.Score.Name.POSITIVE_HIGH]: 1,
  [Time.Score.Name.POSITIVE_MEDIUM]: 0.9,
  [Time.Score.Name.POSITIVE_LOW]: 0.8,
  [Time.Score.Name.NEUTRAL]: 0.5,
  [Time.Score.Name.NEGATIVE_LOW]: 0.08,
  [Time.Score.Name.NEGATIVE_MEDIUM]: 0.04,
  [Time.Score.Name.NEGATIVE_HIGH]: 0
};

const colorInterpolation = D3.scaleLinear()
  .domain([0, 0.5, 1])
  .range(colors.map(color => D3.color(color) || "#000") as any)
  .interpolate(D3.interpolateHcl as any);
