import { APIResponse } from "../types";

const API_BASE =
 process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3334/api/v1";

//Defines the options you can pass to the fetchAPI.
interface FetchAPIOptions<T = unknown> {
  endPoint: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  data?: T | FormData;
  id?: string | number;
  slug?: string;
  setError?: (msg: string) => void;
  headers?: Record<string, string>;
}

//heplers -> it checks if the data contains any files or not.
const hasFiles = (data: unknown): boolean => {
  if (data instanceof File) return true;
  if (Array.isArray(data)) return data.some((item) => hasFiles(item));
  if (data && typeof data === "object")
    return Object.values(data).some((value) => hasFiles(value));
  return false;
};

const toFormData = (data: Record<string, unknown>): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File) formData.append(key, item);
      });
      const valuesWithoutFiles = value.filter((item) => !(item instanceof File));
      if (valuesWithoutFiles.length > 0) formData.append(key, JSON.stringify(valuesWithoutFiles));
      return;
    }
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });

  return formData;
};


export const fetchAPI = async <TResponse = unknown, TData = unknown>({
  endPoint = "", method = "GET", data, id, slug, setError, headers: customHeaders = {},
}: FetchAPIOptions<TData>): Promise<APIResponse<TResponse>> => {
    //Combines API_BASE + endpoint + id/slug to form the request URL.
  const urlParts = [API_BASE, endPoint];
  if (slug) urlParts.push(slug);
  else if (id) urlParts.push(String(id));
  const url = urlParts.join("/");
  //Checks if data contains files. If yes, it converts to FormData.
//If no files, sets Content-Type to application/json.
  const headers: Record<string, string> = { ...customHeaders };

  let finalData: TData | FormData | undefined = data;
  
  if (data && !(data instanceof FormData)) {
    if (hasFiles(data)) {
      finalData = toFormData(data as Record<string, unknown>);
    } else {
      headers["Content-Type"] = "application/json";
    }
  }

  //send fetch request with following fileds
  try {
    const response = await fetch(url, {
      method,
      headers,
      credentials: "include", //(sends cookies)
      body: //(JSON or FormData)
        method !== "GET" && finalData
          ? finalData instanceof FormData
            ? finalData
            : JSON.stringify(finalData)
          : undefined,
      cache: "no-store", //(always fresh data)
    });


    //handle errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Something went wrong.";

      try {
        const json: unknown = JSON.parse(errorText);
        const raw = typeof json === "object" && json !== null
          ? (json as { message?: unknown; error?: unknown }).message ?? (json as { error?: unknown }).error ?? errorText
          : errorText;
        errorMessage = Array.isArray(raw) ? raw.join(", ") : String(raw);
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (setError) setError(errorMessage);
      return { success: false, error: errorMessage, data: null };
    }

   // If everything is fine, returns the JSON wrapped in APIResponse
    const json: TResponse = await response.json();
    return { success: true, data: json, error: null };
    //Catch Network Errors
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server.";
    if (setError) setError(errorMessage);
    return { success: false, error: errorMessage, data: null };
  }
};

export type {APIResponse}

 
