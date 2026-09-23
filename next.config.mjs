/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app never uses next/image, but Next's Image Optimization API
  // (/_next/image) is on by default and unauthenticated -- middleware.js
  // doesn't cover it. Next <15.5.24 has a critical unauthenticated RCE
  // there when AVIF files are involved (GHSA for "Unauthenticated Remote
  // Code Execution in Image Optimization API when AVIF files are used").
  // Disabling optimization removes that endpoint's attack surface entirely
  // until this project upgrades off Next 14. See README's "Known issues".
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
