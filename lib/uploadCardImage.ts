import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabaseClient";

type Kind = "cover" | "avatar" | "gallery" | "badge" | "background";

export async function uploadCardImage(params: {
  cardId: string;
  file: File;
  kind: Kind;
}) {
  const { cardId, file, kind } = params;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "svg"].includes(ext)
    ? ext
    : "jpg";

  const fileName = `${crypto.randomUUID()}.${safeExt}`;

  const path =
    kind === "gallery"
      ? `cards/${cardId}/gallery/${fileName}`
      : `cards/${cardId}/${kind}-${Date.now()}.${safeExt}`;

  const compressionOptions =
    kind === "avatar"
      ? { maxSizeMB: 0.3, maxWidthOrHeight: 800 }
      : kind === "badge"
        ? { maxSizeMB: 0.2, maxWidthOrHeight: 600 }
        : { maxSizeMB: 1, maxWidthOrHeight: 1920 };

  const uploadFile = await (async (): Promise<File> => {
    try {
      if (safeExt === "svg") return file;

      const compressed = await imageCompression(file, {
        ...compressionOptions,
        useWebWorker: true,
      });

      if (compressed instanceof File) return compressed;

      return new File([compressed], fileName, {
        type: file.type || "image/jpeg",
      });
    } catch (e) {
      return file;
    }
  })();

  const { error: uploadError } = await supabase.storage
    .from("card-assets")
    .upload(path, uploadFile, {
      cacheControl: "31536000",
      upsert: false,
      contentType: uploadFile.type || file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("card-assets").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
