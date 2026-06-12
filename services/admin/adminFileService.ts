import { buildAuthHeadersMultipart } from "./adminApiClient";
import { apiFetch } from "@/lib/fetchApi";

export async function uploadFileAndGetUrl(
  token: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/api-proxy/api/files/upload", {
    method: "POST",
    headers: buildAuthHeadersMultipart(token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload thất bại: ${response.status}`);
  }

  return response.text();
}
