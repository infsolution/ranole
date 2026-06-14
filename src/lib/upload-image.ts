import { supabase } from "@/integrations/supabase/client";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_DIMENSION = 1600;
const QUALITY = 0.82;
// 100 years — Supabase allows arbitrarily long signed URLs.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 100;

const DEFAULT_ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface UploadImageOptions {
  /** Max file size in bytes. Default 5MB. */
  maxBytes?: number;
  /** Accepted MIME types. */
  accept?: string[];
  /** Minimum width (px) – throws if image is smaller. */
  minWidth?: number;
  /** Minimum height (px) – throws if image is smaller. */
  minHeight?: number;
  /** Maximum width (px) – throws if image is bigger. */
  maxWidth?: number;
  /** Maximum height (px) – throws if image is bigger. */
  maxHeight?: number;
  /** If true, skip canvas transcoding and upload the original blob (preserves GIF animation, JPG/PNG). */
  preserveOriginal?: boolean;
}

async function readImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.readAsDataURL(file);
  });
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Imagem inválida"));
    i.src = dataUrl;
  });
}

async function compressImage(img: HTMLImageElement, maxDim: number): Promise<Blob> {
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem"))),
      "image/webp",
      QUALITY,
    );
  });
}

export async function uploadImage(
  file: File,
  workspaceId: string,
  options: UploadImageOptions = {},
): Promise<string> {
  const accept = options.accept ?? DEFAULT_ACCEPTED;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  if (!accept.includes(file.type)) {
    throw new Error(`Formato inválido. Use ${accept.map((m) => m.split("/")[1].toUpperCase()).join(", ")}.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`Arquivo muito grande. Máx ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }

  const needsDimensionCheck =
    options.minWidth || options.minHeight || options.maxWidth || options.maxHeight;

  let blob: Blob = file;
  let ext = (file.type.split("/")[1] || "bin").replace("jpeg", "jpg");
  let contentType = file.type;

  if (needsDimensionCheck || !options.preserveOriginal) {
    const img = await readImage(file);
    if (options.minWidth && img.width < options.minWidth) {
      throw new Error(`Largura mínima: ${options.minWidth}px (recebido ${img.width}px).`);
    }
    if (options.minHeight && img.height < options.minHeight) {
      throw new Error(`Altura mínima: ${options.minHeight}px (recebido ${img.height}px).`);
    }
    if (options.maxWidth && img.width > options.maxWidth) {
      throw new Error(`Largura máxima: ${options.maxWidth}px (recebido ${img.width}px).`);
    }
    if (options.maxHeight && img.height > options.maxHeight) {
      throw new Error(`Altura máxima: ${options.maxHeight}px (recebido ${img.height}px).`);
    }

    if (!options.preserveOriginal) {
      const maxDim = options.maxWidth || options.maxHeight
        ? Math.max(options.maxWidth ?? 0, options.maxHeight ?? 0)
        : DEFAULT_MAX_DIMENSION;
      blob = await compressImage(img, maxDim);
      ext = "webp";
      contentType = "image/webp";
    }
  }

  const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const path = `${workspaceId}/${id}.${ext}`;
  const { error } = await supabase.storage.from("user-uploads").upload(path, blob, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data, error: signErr } = await supabase
    .storage.from("user-uploads")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message ?? "Falha ao gerar URL");
  return data.signedUrl;
}
