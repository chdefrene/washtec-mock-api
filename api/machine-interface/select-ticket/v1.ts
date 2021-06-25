import selectTicket from "../../../mock-data/select-ticket.json";
import { getTimerStatus, startTimer } from "../../../helpers";
import { VercelRequest, VercelResponse } from "@vercel/node";

interface SelectTicketResponse {
  "transaction-id": number;
  success: boolean;
  msg: string; // empty on success == true | error message if success == false;
  result: {};
}

const getPayload = async (
  deviceUUID: string
): Promise<SelectTicketResponse> => {
  const isWashing = Boolean(await getTimerStatus(deviceUUID));
  if (!isWashing) await startTimer(deviceUUID);

  return {
    ...selectTicket,
    "transaction-id": Math.round(Math.random() * 10 ** 9),
    success: !isWashing,
    msg: isWashing ? "the selected machine is already in use" : "",
  };
};

export default async (request: VercelRequest, response: VercelResponse) => {
  const deviceUUID = request.query["machineId"];

  if (request.method !== "POST" || !deviceUUID) throw Error;

  const payload = await getPayload(deviceUUID as string);

  return response.status(payload.success ? 200 : 400).json(payload);
};
