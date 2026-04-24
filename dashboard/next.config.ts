import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["168.110.210.101", "outline.webidn.eu.org", "pc.piiblog.net", ".piiblog.net", "*"],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
