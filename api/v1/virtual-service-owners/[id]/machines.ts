import { VercelRequest, VercelResponse } from "@vercel/node";
import { DateTime } from "luxon";
import machines from "../../../../mock-data/machines.json";
import { authenticate, getTimerStatus } from "../../../../helpers";

export default async (request: VercelRequest, response: VercelResponse) => {
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

  for (const key of Object.keys(payload)) {
    const timer = await getTimerStatus(payload[key].devUUID);

    payload[key] = {
      ...payload[key],
      isBusy: Boolean(timer),
      machineDbLastComeInTimestampUtc: DateTime.fromSeconds(
        timer?.start_time ?? DateTime.utc().toSeconds()
      ).toFormat("yyyy-MM-dd HH:mm:ss"),
    };
  }

  return response.status(200).json(payload);
};
