import { VercelRequest, VercelResponse } from "@vercel/node";
import machines from "../../../../mock-data/machines.json";
import { DateTime } from "luxon";
import { authenticate } from "../../../../helpers";

export default (request: VercelRequest, response: VercelResponse) => {
  let responseCode: number;
  let payload: object;

  if (request.method === "GET") {
    if (!authenticate(request.headers, "digitalhub")) {
      responseCode = 403;
      payload = { debugMessage: "Credential is not allowed to use this API" };
    } else {
      responseCode = 200;
      payload = machines;

      // Update timestamp for each machine
      Object.keys(payload).forEach((key) => {
        payload[key] = {
          ...payload[key],
          machineDbLastComeInTimestampUtc: DateTime.utc()
            .minus({ minute: Math.floor(Math.random() * 10) })
            .toFormat("yyyy-MM-dd HH:MM:ss"),
        };
      });
    }
  } else {
    responseCode = 400;
    payload = { debugMessage: "Mandatory GET parameter 'limit' missing" };
  }

  response.status(responseCode).json(payload);
};
