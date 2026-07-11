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
      // Newsletter route rename — /playbook → /pickleball-101.
      // Google Search Console flagged /playbook/* as 404 after the
      // folder was swapped. 301 transfers ranking signal + clears the
      // "Not found" report.
      {
        source: '/playbook',
        destination: '/pickleball-101',
        permanent: true,
      },
      {
        source: '/playbook/:slug*',
        destination: '/pickleball-101/:slug*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
