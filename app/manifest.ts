import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRACKER",
    short_name: "CC",
    description: "Life & Soul · Christmas Cracker 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#c40021",
    theme_color: "#c40021",
    icons: [
      {
        src: "/brand/cracker-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/cracker-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/cracker-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
