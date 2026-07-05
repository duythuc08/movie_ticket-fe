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
    const data = await response.json().catch(() => ({}));
    const { getErrorMessage } = await import("@/lib/errors");
    throw new Error(getErrorMessage((data as any)?.code, "Tải file lên thất bại"));
  }

  return response.text();
}
