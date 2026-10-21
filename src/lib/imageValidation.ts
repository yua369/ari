// §13-14 Image Security: 許可するMIME/拡張子とサイズ上限を1箇所で管理する。
// このファイルはNode専用モジュール(fs/sharp等)に依存しない。Client Component からも安全にimportできる。

export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif"];
export const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".heif"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB

export type ImageValidationError = { code: "INVALID_TYPE" | "TOO_LARGE" | "EMPTY"; fileName: string };

function extFromName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

/** アップロード前にMIME種別・拡張子・サイズを検証する。DB書き込み前に必ず呼ぶ（§26 Data Integrity: 孤立Memory防止）。 */
export function validateImageFile(file: File): ImageValidationError | null {
  if (file.size === 0) return { code: "EMPTY", fileName: file.name };
  if (file.size > MAX_IMAGE_BYTES) return { code: "TOO_LARGE", fileName: file.name };
  const ext = extFromName(file.name);
  const mimeOk = !file.type || ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());
  const extOk = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  if (!mimeOk || !extOk) return { code: "INVALID_TYPE", fileName: file.name };
  return null;
}
