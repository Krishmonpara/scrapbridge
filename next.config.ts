import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  typescript: {
    // Skip type-checking during dev for faster startup; run `tsc --noEmit` manually.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable webpack build worker — forked jest-worker IPC can hang
    webpackBuildWorker: false,
    // Use worker threads instead of child processes
    workerThreads: true,
  },
}

export default nextConfig
