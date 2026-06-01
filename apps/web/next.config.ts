import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@studioos/ui',
    '@studioos/shared',
    '@studioos/ai-service',
    '@studioos/context-engine',
    '@studioos/dependency-engine',
    '@studioos/assembly-engine',
  ],
}

export default nextConfig
