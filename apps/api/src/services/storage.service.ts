import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(filePath: string, folder: string) {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return {
      secure_url: `/uploads/${filePath.split(/[\\/]/).pop()}`,
      public_id: `local/${Date.now()}`,
    };
  }
  return cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
}
