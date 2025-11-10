type MaestroApiOptions = RequestInit & {
  token?: string;
};

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL environment variable is not set.");
}

export class MaestroApiError extends Error {
  public status: number;
  public responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "MaestroApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function maestroApi<T>(
  endpoint: string,
  options: MaestroApiOptions = {},
): Promise<T> {
  const { token, headers, body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      Authorization: token ? `Bearer ${token}` : `${process.env.MAESTRO_SECRET_TOKEN ?? ""}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body instanceof FormData ? body : body,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new MaestroApiError(
      `Maestro API request failed: ${response.statusText}`,
      response.status,
      data,
    );
  }

  return data as T;
}

