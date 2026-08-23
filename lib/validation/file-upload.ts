const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

const DANGEROUS_EXTENSIONS = new Set([
  "exe",
  "sh",
  "bat",
  "cmd",
  "msi",
  "js",
  "mjs",
  "ps1",
  "php",
  "html",
  "htm",
  "svg",
]);

export type FileUploadValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Defense-in-depth check for uploaded files: never trust the extension alone
 * (docs/08-security.md). Validates the declared MIME type, size, and rejects
 * a denylist of dangerous extensions regardless of the declared MIME type.
 */
export function validateFileUpload(file: {
  name: string;
  type: string;
  size: number;
}): FileUploadValidationResult {
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: "ファイルサイズは20MB以下にしてください。" };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: "対応していないファイル形式です。" };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && DANGEROUS_EXTENSIONS.has(extension)) {
    return { ok: false, reason: "このファイル形式はアップロードできません。" };
  }

  return { ok: true };
}
