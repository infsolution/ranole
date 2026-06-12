import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB pre-processing limit
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;
// 100 years — Supabase allows arbitrarily long signed URLs.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 100;

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Imagem inválida"));
    i.src = dataUrl;
  });
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
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

export async function uploadImage(file: File, workspaceId: string): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG, WEBP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande. Máx 5MB.");
  }
  const blob = await compressImage(file);
  const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const path = `${workspaceId}/${id}.webp`;
  const { error } = await supabase.storage.from("user-uploads").upload(path, blob, {
    contentType: "image/webp",
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
