import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Solo direcciones de este equipo, sin comodines ni orígenes externos.
  allowedDevOrigins: [
    "127.0.0.1",
    ...Object.values(networkInterfaces()).flatMap((addresses) =>
      (addresses ?? [])
        .filter(({ family, internal }) => family === "IPv4" && !internal)
        .map(({ address }) => address),
    ),
  ],
};

export default nextConfig;
