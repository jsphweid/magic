// import { option as Option } from "fp-ts";
// import _ from "lodash/fp";
// import Moment from "moment";

// import * as Result from "../Result";
// import * as Time from "../Schema/Time";
// import * as Request from "./Request";

// export interface Record {
//   start_time: number;
//   end_time: number;
//   desktop_id: "a39122b6-e310-4620-9cae-53fb9738c0b8";
//   filename: string;
//   title: string;
//   idle: boolean;
// }

// // https://timeline.toggl.com/api/v8/timeline?start_date=1539993600&end_date=1541613375

// export const getFromInterval = async (
//   interval: Time.StoppedInterval
// ): Promise<Result.Result<Record[]>> => {
//   let records: Record[] = [];
//   for (const batch of Time.batchesFromInterval(
//     Moment.duration(1, "day"),
//     interval
//   )) {
//     const result = (await Request.execute<Record[]>({
//       method: "GET",
//       resource: `https://timeline.toggl.com/api/v8/timeline`,
//       params: Option.some({
//         start_date: Math.max(
//           interval.start.unix(),
//           batch.start.subtract(3, "hour").unix()
//         ),
//         end_date: Math.min(
//           interval.stop.unix(),
//           batch.stop.add(3, "hour").unix()
//         )
//       }),
//       data: Option.none
//     })).map(recordsBatch => (records = records.concat(recordsBatch)));
//     if (result.isLeft()) return result;
//   }
//   return Result.success(_.uniqWith(_.isEqual)(records));
// };
