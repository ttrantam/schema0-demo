import { env } from "@template/auth";

export const remoteServerUrl = `https://${env.YB_API_HOSTNAME}/api/customer/${env.YB_ORGANIZATION_ID}-${env.YB_APP_ID}`;

export const fetchCustomResources = async (
  path: string,
  options?: RequestInit,
  setContentTypeJson = true,
) => {
  return fetch(`${remoteServerUrl}/${path}`, {
    ...options,
    headers: {
      ...(setContentTypeJson ? { "content-type": "application/json" } : {}),
      Authorization: `Bearer ${env.ROOT_BACKEND_API_KEY}`,
      ...options?.headers,
    },
  });
};
