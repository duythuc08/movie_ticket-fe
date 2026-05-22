import { adminPostFormData } from "./adminApiClient";

interface FileUploadResult {
    url: string;
    publicId: string;
}

export async function uploadFile(
  token: string,
  file: File
): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await adminPostFormData<FileUploadResult>(
    token,
    "/file/upload",
    formData
  );

  return result;
}

export async function uploadFileAndGetUrl(
  token: string,
  file: File
): Promise<string> {
  const result = await uploadFile(token, file);
  return result.url;
}

