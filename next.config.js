/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },

  // ── 301 redirects ────────────────────────────────────────────────────────
  // Permanent moves for paddle slugs that have been renamed. 301 transfers
  // SEO ranking signal from old URL → new URL. Keep this list pruned over
  // time, but never delete entries with active inbound link weight.
  async redirects() {
    return [
      {
        source: '/paddles/luzz-glider-elongated',
        destination: '/paddles/luzz-glider-hybrid',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
