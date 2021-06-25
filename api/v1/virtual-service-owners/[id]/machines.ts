import { VercelRequest, VercelResponse } from "@vercel/node";
import machines from "../../../../mock-data/machines.json";
import { DateTime } from "luxon";
import { authenticate, isWashing } from "../../../../helpers";

export default (request: VercelRequest, response: VercelResponse) => {
  const { method, headers } = request;

  // Check request method
  if (method !== "GET")
    return response
      .status(400)
      .json({ debugMessage: "Mandatory GET parameter 'limit' missing" });

  // Handle authentication
  if (!authenticate(headers, "digitalhub"))
    return response
      .status(403)
      .json({ debugMessage: "Credential is not allowed to use this API" });

  // Update some values for each machine
  const payload = machines;
  Object.keys(payload).forEach((key) => {
    payload[key] = {
      ...payload[key],
      isBusy: isWashing(),
      machineDbLastComeInTimestampUtc: DateTime.utc()
        .minus({ minute: Math.round(Math.random() * 10) })
        .toFormat("yyyy-MM-dd HH:MM:ss"),
    };
  });

  return response.status(200).json(payload);
};
