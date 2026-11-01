import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(<img src={await brandIconDataUri({ square: true })} alt="" width={180} height={180} />, size);
}
