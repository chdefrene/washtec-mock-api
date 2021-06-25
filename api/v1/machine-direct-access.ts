import { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate } from "../../helpers";
import fetch from "node-fetch";

export interface RequestData {
  deviceUUID: string;
  method: string;
  path: string;
  payload: string;
}

interface ResponseData {
  responseCode: number;
  payload: string;
}

// Fetch requires a protocol, but HTTPS does not work on localhost
const protocol = process.env.VERCEL_ENV === "development" ? "http" : "https";

export default async (request: VercelRequest, response: VercelResponse) => {
  const { method, headers, body } = request;

  // Check request method
  if (method !== "POST")
    return response.status(405).json({
      timestamp: new Date().toISOString().replace("Z", "+00:00"),
      status: 405,
      error: "Method Not Allowed",
      message: "",
      path: "/v1/machine-direct-access",
    });

  // Handle authentication
  if (!authenticate(headers, "machine-interface"))
    return response
      .status(403)
      .json({ debugMessage: "Credential is not allowed to use this API" });

  const machineBody: RequestData = body ?? {};

  // Verify request data
  for (const field of ["deviceUUID", "method", "path", "payload"]) {
    if (!Object.keys(machineBody).includes(field)) {
      return response
        .status(400)
        .json({ debugMessage: `Field '${field}' is mandatory` });
    }
  }

  // Make request to mock machine
  try {
    const { path: machinePath, method: machineMethod } = machineBody;

    const machineResponse = await fetch(
      `${protocol}://${process.env.VERCEL_URL}/api/machine-interface/${machinePath}`,
      { method: machineMethod }
    );

    const responseData: ResponseData = {
      responseCode: machineResponse.status,
      // WashTec includes indentation in their JSON response output
      payload: JSON.stringify(await machineResponse.json(), null, 4),
    };

    return response.status(200).json(responseData);
  } catch {
    return response
      .status(403)
      .json({ debugMessage: "(Role/method/path) tuple not allowed" });
  }
};
