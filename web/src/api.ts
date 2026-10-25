export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}
export async function requestJSON<T>(url: string, body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {method:body === undefined ? 'GET' : 'POST',headers:body === undefined ? {Accept:'application/json'} : {Accept:'application/json','Content-Type':'application/json'},body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(15000),cache:'no-store'});
  } catch { throw new ApiError('The shop server could not be reached. Check that the local server is running, then retry.'); }
  let data: unknown;
  try { data = await response.json(); } catch { throw new ApiError(`The server returned an unreadable response (HTTP ${response.status}). No result was invented.`, response.status); }
  if (!response.ok) {
    const detail = (data as {detail?:unknown})?.detail;
    throw new ApiError(typeof detail === 'string' ? detail : `The request was refused (HTTP ${response.status}). Please refresh the bench and try again.`,response.status);
  }
  return data as T;
}
