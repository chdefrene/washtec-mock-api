import { VercelRequest, VercelResponse } from "@vercel/node";
import machineStatus from "../../mock-data/machine-status.json";
import selectTicket from "../../mock-data/select-ticket.json";
import { authenticate, isWashing } from "../../helpers";
import { DateTime } from "luxon";

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
  method: "GET" | "POST";
  path: "state/v1" | "select-ticket/v1";
  payload: string;
}

interface ResponseData {
  responseCode?: number; // Only for success
  payload?: string; // Only for success
  debugMessage?: string; // Only for errors
}

interface MachineStatusResponse {
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

interface SelectTicketResponse {
  "transaction-id": number;
  success: boolean;
  msg: string; // empty on success == true | error message if success == false;
  result: {};
}

const getMachineStatusPayload = (): MachineStatusResponse => {
  const now = DateTime.utc();
  const duration = 10 - parseInt(now.minute.toString().slice(-1));

  return {
    ...machineStatus,
    "transaction-id": Math.round(Math.random() * 10 ** 9),
    result: {
      ...machineStatus.result,
      "ts-current": Math.round(now.toSeconds()),
      "ts-last-update": Math.round(now.minus({ minute: duration }).toSeconds()),
      "carwash-state": isWashing()
        ? CarWashState.MS_PROG_RUNNING
        : CarWashState.MS_READY_TO_RECEIVE_WASH_PROGRAM,
      "remaining-washtime": isWashing() ? duration : 0,
      "current-ticket-id": isWashing()
        ? Math.round(Math.random() * 10 ** 4)
        : 0,
    },
  };
};

const getSelectTicketPayload = (): SelectTicketResponse => {
  return {
    ...selectTicket,
    "transaction-id": Math.round(Math.random() * 10 ** 9),
    success: !isWashing(),
    msg: isWashing() ? "the selected machine is already in use" : "",
  };
};

export default (request: VercelRequest, response: VercelResponse) => {
  let responseCode: number;
  let payload: object;

  if (request.method === "POST") {
    if (!authenticate(request.headers, "machine-interface")) {
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
        try {
          switch (body.path) {
            case "state/v1":
              if (body.method !== "GET") throw Error;
              responseCode = 200;
              payload = getMachineStatusPayload();
              break;
            case "select-ticket/v1":
              if (body.method !== "POST") throw Error;
              responseCode = isWashing() ? 400 : 200;
              payload = getSelectTicketPayload();
              break;
            default:
              throw Error;
          }
        } catch {
          responseCode = 403;
          payload = { debugMessage: "(Role/method/path) tuple not allowed" };
        }
      }
    }
  } else {
    responseCode = 405;
    payload = {
      timestamp: new Date().toISOString().replace("Z", "+00:00"),
      status: responseCode,
      error: "Method Not Allowed",
      message: "",
      path: "/v1/machine-direct-access",
    };
  }

  const isError = "debugMessage" in payload;

  const responseData: ResponseData = isError
    ? payload
    : {
        responseCode,
        // WashTec includes indentation in their JSON response output
        payload: JSON.stringify(payload, null, 4),
      };

  // We can only call VercelResponse once
  response.status(isError ? responseCode : 200).json(responseData);
};
