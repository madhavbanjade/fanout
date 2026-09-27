import { APIResponse } from "../types";
import { API_BASES, isNetworkError } from "./apiHosts";

// Remembers which base last worked so we're not retrying a dead instance on
// every request; still re-checked on failure so we notice when it comes back.
let activeBaseIndex = 0;

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

  const buildUrl = (base: string) => {
    const urlParts = [base, endPoint];
    if (slug) urlParts.push(slug);
    else if (id) urlParts.push(String(id));
    return urlParts.join("/");
  };

  //send fetch request, trying the last-known-good base first and falling
  //back through the rest of API_BASES if it's unreachable (not just erroring)
  let lastNetworkError: unknown = null;
  for (let attempt = 0; attempt < API_BASES.length; attempt++) {
    const baseIndex = (activeBaseIndex + attempt) % API_BASES.length;
    const url = buildUrl(API_BASES[baseIndex]);

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

      activeBaseIndex = baseIndex;

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
      if (isNetworkError(error) && attempt < API_BASES.length - 1) {
        lastNetworkError = error;
        continue; //this instance is down — try the next base
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect to the server.";
      if (setError) setError(errorMessage);
      return { success: false, error: errorMessage, data: null };
    }
  }

  // Unreachable in practice (loop above always returns), kept for TS narrowing.
  const errorMessage =
    lastNetworkError instanceof Error
      ? lastNetworkError.message
      : "Failed to connect to the server.";
  if (setError) setError(errorMessage);
  return { success: false, error: errorMessage, data: null };
};

export type {APIResponse}

 
