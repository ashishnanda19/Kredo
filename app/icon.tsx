import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(<img src={await brandIconDataUri()} alt="" width={512} height={512} />, size);
}
