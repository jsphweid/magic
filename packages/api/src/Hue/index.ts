import * as Express from "express";

export const loginHandler: Express.Handler = async (request, response) => {
  // tslint:disable-next-line:no-console
  console.log(request.query.code);
  response.status(200).end();
};
