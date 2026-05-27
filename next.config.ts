import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextConfig: NextConfig = {
  experimental: {},
  turbopack: {
    root: __dirname,
  },
};

export default withNextra(nextConfig);
