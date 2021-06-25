import selectTicket from "../../../mock-data/select-ticket.json";
import { isWashing } from "../../../helpers";
import { VercelRequest, VercelResponse } from "@vercel/node";

interface SelectTicketResponse {
  "transaction-id": number;
  success: boolean;
  msg: string; // empty on success == true | error message if success == false;
  result: {};
}

const getPayload = (): SelectTicketResponse => {
  return {
    ...selectTicket,
    "transaction-id": Math.round(Math.random() * 10 ** 9),
    success: !isWashing(),
    msg: isWashing() ? "the selected machine is already in use" : "",
  };
};

export default (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== "POST") throw Error;

  return response.status(isWashing() ? 400 : 200).json(getPayload());
};
