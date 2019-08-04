import Moment from "moment-timezone";

export const createHoursAgo = (num: number) => Moment().subtract(num, "hours");
