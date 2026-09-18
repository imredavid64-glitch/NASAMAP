import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NASAMAP — Every human has a seat at the frontier",
    short_name: "NASAMAP",
    description:
      "Plan, fly and live a real Moon-to-Mars mission with open NASA data. Mission design game, live orbital feeds, and a cosmic data commons.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}