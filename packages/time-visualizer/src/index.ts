import _ from "lodash";
import Moment from "moment";
import * as D3 from "d3";

import DATA from "../data/data.json";

const {
  data: {
    now: { interval: dataInterval, tagOccurences }
  }
} = DATA;

const scoreValues: {
  [scoreLabel: string]: number;
} = {
  POSITIVE_HIGH: 4,
  POSITIVE_MEDIUM: 2,
  POSITIVE_LOW: 1,
  NEUTRAL: 0,
  NEGATIVE_LOW: 1,
  NEGATIVE_MEDIUM: 2,
  NEGATIVE_HIGH: 4
};

const scoreLabels = Object.keys(scoreValues).reverse();

const scores = (
  start: string,
  stop: string | null,
  stepMS: number
): {
  [dateMS: number]: {
    [tagName: string]: number;
  };
} => {
  const initialScores = scoreLabels.reduce(
    (acc, scoreText) => ({ ...acc, [scoreText]: 0 }),
    {}
  );

  const MSIntervals = _.range(
    Moment(start).valueOf(),
    Moment(stop || undefined).valueOf(),
    stepMS
  );

  const MSIntervalScores = _.fromPairs(
    _.zip(
      MSIntervals,
      _.range(MSIntervals.length).map(() => _.clone(initialScores))
    )
  );

  for (const { interval, tag } of tagOccurences) {
    const startMS = Moment(interval.start).valueOf();
    const stopMS = Moment(interval.stop || undefined).valueOf();

    const startIntervalMS = MSIntervals.find(MS => MS >= startMS);

    if (!startIntervalMS) {
      continue;
    }

    for (const intervalMS of _.range(startIntervalMS, stopMS, stepMS)) {
      MSIntervalScores[intervalMS][tag.score] = scoreValues[tag.score];
    }
  }

  // for (const scores of Object.values(MSIntervalScores)) {
  //   if (_.sum(Object.values(scores)) <= 0) {
  //     scores.NEUTRAL = 1;
  //   }
  // }

  return MSIntervalScores;
};

const data = Object.entries(
  scores(dataInterval.start, dataInterval.stop, 10 * 60 * 1000)
).map(([intervalMS, scores]) => ({
  dateMS: parseInt(intervalMS, 10),
  ...scores
}));

D3.selectAll("svg").remove();

const svg = D3.select("body").append("svg");

const width = 40000;
const height = 100;

const series = D3.stack()
  .keys(scoreLabels)
  .order(D3.stackOrderNone)
  .offset(D3.stackOffsetSilhouette)(data);

const x = D3.scaleLinear()
  .domain([Moment(dataInterval.start).valueOf(), Moment().valueOf()])
  .range([0, width]);

const y = D3.scaleLinear()
  .domain([0, 10])
  // .domain([0, 1])
  .range([height, 0]);

const colorStopsForScores: {
  [scoreText: string]: number;
} = {
  POSITIVE_HIGH: 1,
  POSITIVE_MEDIUM: 0.95,
  POSITIVE_LOW: 0.4,
  NEUTRAL: 0,
  NEGATIVE_LOW: 0.2,
  NEGATIVE_MEDIUM: 0.1,
  NEGATIVE_HIGH: 0
};

const color = (index: number) =>
  index === 3
    ? D3.hsl(0, 0, 0, 0)
    : D3.interpolateHslLong(
        D3.color("hsl(0, 97%, 62%)") || "#000",
        D3.color("hsl(190, 97%, 62%)") || "#fff"
      )(colorStopsForScores[scoreLabels[index]]);

const area = D3.area()
  .x(datum => x(datum.data.dateMS))
  .y0(datum => y(datum[0]))
  .y1(datum => y(datum[1]))
  .curve(D3.curveBasis);

svg
  .selectAll("path")
  .data(series)
  .enter()
  .append("path")
  .attr("d", area)
  .attr("fill", (_datum: never, index: number) => color(index));
