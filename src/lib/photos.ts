export async function compressPhoto(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    throw new Error(
      "Use JPG, PNG or WebP photos. Convert HEIC photos to JPG first.",
    );
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Each photo must be smaller than 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Photo processing is not supported in this browser.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.65);
    if (result.length > 650_000)
      throw new Error(
        "This photo is too detailed for demo storage. Please use a smaller photo.",
      );
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
