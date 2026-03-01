import { API_ROOT } from './apiConfig';
import { ApiError, type ApiErrorPayload } from './apiError';

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;
  defaultHeaders?: HeadersInit;
  token?: string;
};

const createHeaders = ({
  defaultHeaders,
  headers,
  token,
}: Pick<ApiRequestOptions, 'defaultHeaders' | 'headers' | 'token'>) => {
  const mergedHeaders = new Headers(defaultHeaders);
  const requestHeaders = new Headers(headers);
  requestHeaders.forEach((value, key) => {
    mergedHeaders.set(key, value);
  });
  if (token && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }
  return mergedHeaders;
};

const parseResponsePayload = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const toApiError = (payload: unknown, response: Response) => {
  const apiPayload =
    typeof payload === 'object' && payload
      ? (payload as ApiErrorPayload)
      : undefined;

  const message =
    apiPayload?.message || response.statusText || 'Request failed.';
  const code = apiPayload?.code || apiPayload?.error;
  const details = apiPayload?.details;

  return new ApiError(message, response.status, code, details);
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { headers, defaultHeaders, token, ...requestInit } = options;
  const response = await fetch(`${API_ROOT}${path}`, {
    ...requestInit,
    headers: createHeaders({ defaultHeaders, headers, token }),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    throw toApiError(payload, response);
  }

  return payload as T;
};

export const isAbortError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
  );
