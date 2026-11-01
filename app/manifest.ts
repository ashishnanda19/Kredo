import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/config";


export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name}: pay later at campus`,
    short_name: BRAND.name,
    description: "Demo preview, no real money. Student pay-later interface.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
