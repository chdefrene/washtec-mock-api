import { VercelRequest, VercelResponse } from "@vercel/node";
import machineStatus from "../../mock-data/machine-status.json";
import { authenticate } from "../../helpers";

enum CarWashState {
  MS_UNKNOWN,
  MS_ERROR,
  MS_PROG_OVERTAKEN,
  MS_CAR_POSITIONED,
  MS_PRESS_START_BUTTON,
  MS_PROG_RUNNING,
  MS_WASH_OVER_PASS_THR_BAY,
  MS_WASH_OVER_NO_PASS_THR_BAY,
  MS_BACK_UP,
  MS_FROST,
  MS_READY_TO_RECEIVE_WASH_PROGRAM,
}

interface RequestData {
  deviceUUID: string;
  method: "GET";
  path: "state/v1";
  payload: string;
}

interface ResponseData {
  responseCode?: number; // Only for success
  payload?: string; // Only for success
  debugMessage?: string; // Only for errors
}

interface IMachineStatus {
  "transaction-id": number;
  success: boolean;
  msg: string | null; // empty on success == true | error message if success == false
  result: {
    "ts-current": number; // uint: current timestamp on the embedded system as a unix timestamp
    "ts-last-update": number; // uint: current timestamp the status was updated as a unix timestamp
    "operation-mode": number; // uint: current operation mode (stay in car):
    "carwash-state": CarWashState; // uint: current car wash state, see listing below
    "remaining-washtime": number; // uint: remaining time for the current wash (in secounds)
    "current-ticket-id": number; // current ticket id thats been washed, empty if no progress
  };
}

const getMachineStatusPayload = (): IMachineStatus => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const minutes = new Date().getUTCMinutes();

  // Simulate a wash running for 10 minutes three times each hour.
  const isWashing =
    (0 <= minutes && minutes <= 10) ||
    (20 <= minutes && minutes <= 30) ||
    (40 <= minutes && minutes <= 50);

  return {
    ...machineStatus,
    "transaction-id": Math.floor(Math.random() * 10 ** 9),
    result: {
      ...machineStatus.result,
      "ts-current": now,
      "ts-last-update": now - parseInt(minutes.toString().slice(-1)) * 60,
      "carwash-state": isWashing
        ? CarWashState.MS_PROG_RUNNING
        : CarWashState.MS_READY_TO_RECEIVE_WASH_PROGRAM,
      "remaining-washtime": isWashing
        ? 10 - parseInt(minutes.toString().slice(-1))
        : 0,
      "current-ticket-id": isWashing ? Math.floor(Math.random() * 10 ** 4) : 0,
    },
  };
};

export default (request: VercelRequest, response: VercelResponse) => {
  let responseCode: number;
  let payload: object;

  if (!authenticate(request.headers)) {
    responseCode = 403;
    payload = { debugMessage: "Credential is not allowed to use this API" };
  } else {
    // Verify request data
    const body: RequestData = request.body ?? {};
    const requestBodyKeys = ["deviceUUID", "method", "path", "payload"];
    let missingField;
    for (const field of requestBodyKeys) {
      if (!Object.keys(body).includes(field)) {
        missingField = field;
        break;
      }
    }

    if (missingField) {
      responseCode = 400;
      payload = { debugMessage: `Field '${missingField}' is mandatory` };
    } else {
      switch (body.path) {
        case "state/v1":
          responseCode = 200;
          payload = getMachineStatusPayload();
          break;
        default:
          responseCode = 403;
          payload = { debugMessage: "(Role/method/path) tuple not allowed" };
      }
    }
  }

  const responseData: ResponseData =
    responseCode === 200
      ? {
          responseCode,
          // WashTec includes indentation in their JSON response output
          payload: JSON.stringify(payload, null, 4),
        }
      : payload;

  // We can only call VercelResponse once
  response.status(responseCode).json(responseData);
};
