import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atmosphera Site Reports",
    short_name: "Atmosphera",
    description: "Construction site reporting demo",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#355c4b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
