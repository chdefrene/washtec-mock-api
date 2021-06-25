import { VercelRequest, VercelResponse } from "@vercel/node";
import machineStatus from "../../../mock-data/machine-status.json";
import { isWashing } from "../../../helpers";
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

const getPayload = (): MachineStatusResponse => {
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

export default (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== "GET") throw Error;

  return response.status(200).json(getPayload());
};
