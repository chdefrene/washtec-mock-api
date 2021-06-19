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
