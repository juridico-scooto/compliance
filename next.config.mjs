/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // Garante que o Prisma Client seja gerado antes do build na Vercel
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || "local";
  },
};

export default nextConfig;
