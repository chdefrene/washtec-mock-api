import { IncomingHttpHeaders } from "http";

interface AuthenticationHeaders extends IncomingHttpHeaders {
  Username: string;
  "Password-Utf8-Base64": string;
  "Interaction-Uuid": string;
  MachineDirectAccessRole: string;
}

/**
 * Check request headers for authentication credentials.
 * Return `true` if authenticated successfully, `false` otherwise.
 */
export const authenticate = (
  headers: Partial<AuthenticationHeaders>
): boolean => {
  const headerKeys = [
    "Username",
    "Password-Utf8-Base64",
    "Interaction-Uuid",
    "MachineDirectAccessRole",
  ];

  return headerKeys.every((header) =>
    Object.keys(headers ?? {}).includes(header.toLowerCase())
  );
};

/**
 * Simulate a wash running for 10 minutes three times each hour.
 */
export const isWashing = (): boolean => {
  const minutes = new Date().getUTCMinutes();

  return (
    (0 <= minutes && minutes <= 10) ||
    (20 <= minutes && minutes <= 30) ||
    (40 <= minutes && minutes <= 50)
  );
};
