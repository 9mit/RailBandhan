import { AppError } from "@/lib/errors";
import sharp from "sharp";
export interface PreprocessedImage {
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  metadataStripped: boolean;
}
export interface ImagePreprocessor {
  preprocess(inputBuffer: Buffer, mimeType: string): Promise<PreprocessedImage>;
}
export class BasicImagePreprocessor implements ImagePreprocessor {
  async preprocess(
    input: Buffer,
    mimeType: string,
  ): Promise<PreprocessedImage> {
    if (mimeType === "application/pdf")
      return { buffer: input, mimeType, metadataStripped: false };
    try {
      const { data, info } = await sharp(input, {
        limitInputPixels: 20_000_000,
        failOn: "error",
      })
        .rotate()
        .resize({
          width: 2200,
          height: 2200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .grayscale()
        .normalize()
        .png()
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: data,
        mimeType: "image/png",
        width: info.width,
        height: info.height,
        metadataStripped: true,
      };
    } catch {
      throw new AppError(
        "validation",
        "The ticket image is invalid or too large to decode",
      );
    }
  }
}
export function getImagePreprocessor(): ImagePreprocessor {
  return new BasicImagePreprocessor();
}
