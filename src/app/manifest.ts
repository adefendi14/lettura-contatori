import type { MetadataRoute } from "next";
import { basePath, withBase } from "@/lib/site";

const home = `${basePath || ""}/`.replace(/\/\/+/g, "/") || "/";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lettura Contatori",
    short_name: "Contatori",
    description:
      "Letture acqua calda e riscaldamento per scala, anche offline sul telefono.",
    id: home,
    start_url: home,
    scope: home,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#FAFAFA",
    lang: "it",
    icons: [
      {
        src: withBase("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBase("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBase("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
