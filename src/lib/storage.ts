import path from "path";
import sharp from "sharp";
import { ALLOWED_IMAGE_EXTENSIONS } from "@/lib/imageValidation";

export { validateImageFile, ALLOWED_IMAGE_MIME_TYPES, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_BYTES } from "@/lib/imageValidation";

// §無料クラウド常時稼働化: Vercel等のサーバーはファイルシステムを永続保存できないため、
// 画像はディスクへ書かず、メモリ上で処理してDB(Bytes列)へ保存する。
// 呼び出し側は事前に validateImageFile() を通すこと。元画像は絶対に再生成・描き直ししない。

function extFromName(name: string) {
  const ext = path.extname(name).toLowerCase();
  return ext || ".png";
}

// Prisma BytesはUint8Array<ArrayBuffer>を要求するが、Node Bufferの.bufferはArrayBufferLike(SharedArrayBuffer含む)型のため、
// 新しいArrayBufferへコピーして型を正規化する。
function toUint8Array(buffer: Buffer): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(new ArrayBuffer(buffer.byteLength));
  arr.set(buffer);
  return arr;
}

export async function saveChartImage(
  _memoryId: string,
  file: File,
  baseName: string
): Promise<{
  originalFile: string;
  thumbnailFile: string | null;
  originalData: Uint8Array<ArrayBuffer>;
  thumbnailData: Uint8Array<ArrayBuffer> | null;
  width: number | null;
  height: number | null;
}> {
  const ext = ALLOWED_IMAGE_EXTENSIONS.includes(extFromName(file.name)) ? extFromName(file.name) : ".png";
  const buffer = Buffer.from(await file.arrayBuffer());

  let width: number | null = null;
  let height: number | null = null;
  let thumbnailBuffer: Buffer | null = null;

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
    thumbnailBuffer = await image.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  } catch {
    // サムネイル生成に失敗しても元画像の保存は成功させる
  }

  return {
    originalFile: `${baseName}${ext}`,
    thumbnailFile: thumbnailBuffer ? `${baseName}-thumb.webp` : null,
    originalData: toUint8Array(buffer),
    thumbnailData: thumbnailBuffer ? toUint8Array(thumbnailBuffer) : null,
    width,
    height,
  };
}

export function contentTypeFor(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}
