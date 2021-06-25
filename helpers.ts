import { IncomingHttpHeaders } from "http";
import fetch from "node-fetch";

interface AuthenticationHeaders extends IncomingHttpHeaders {
  Username: string;
  "Password-Utf8-Base64": string;
  "Interaction-Uuid": string;
  MachineDirectAccessRole?: string;
}

interface TimerCheckStartResponse {
  timer: string;
  request_id: string;
  status: string;
  now: number;
  message: string;
  start_time: number;
  start_seconds: number;
  seconds_elapsed: number;
  seconds_remaining: number;
  new_start_time: number;
  new_start_seconds: number;
}

interface TimerCheckStatusResponse {
  timer: string;
  request_id: string;
  status: string;
  now: number;
  message: string;
  start_time: number;
  start_seconds: number;
  seconds_elapsed: number;
  seconds_remaining: number;
}

/**
 * Check request headers for authentication credentials.
 * Return `true` if authenticated successfully, `false` otherwise.
 */
export const authenticate = (
  headers: Partial<AuthenticationHeaders>,
  apiType: "digitalhub" | "machine-interface"
): boolean => {
  const headerKeys = ["Username", "Password-Utf8-Base64", "Interaction-Uuid"];
  if (apiType === "machine-interface")
    headerKeys.push("MachineDirectAccessRole");

  return headerKeys.every((header) =>
    Object.keys(headers ?? {}).includes(header.toLowerCase())
  );
};

/**
 * Get current timer status, or `null` if timer is not running.
 */
export const getTimerStatus = async (
  timerId: string
): Promise<TimerCheckStatusResponse> => {
  const response = await fetch(`https://timercheck.io/${timerId}`);

  return response.ok ? response.json() : null;
};

/**
 * Start the provided timer for 5 minutes.
 */
export const startTimer = async (
  timerId: string
): Promise<TimerCheckStartResponse> => {
  const response = await fetch(`https://timercheck.io/${timerId}/300`);

  return response.json();
};
