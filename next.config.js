/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose VERCEL_ENV (a Vercel system env, server-only by default) to the
  // client bundle so hooks like useReactions can skip writes on preview deploys.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "development",
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },

  async headers() {
    const rules = [
      {
        // Tell Google not to index Next.js static assets (JS/CSS chunks with ?dpl= params).
        source: '/_next/static/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];

    // Preview and development builds: block indexing on every route.
    // Vercel already does this automatically for preview deployments, but
    // we add it explicitly so it's visible in code and works in local dev too.
    if (process.env.VERCEL_ENV !== 'production') {
      rules.push({
        source: '/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      });
    }

    return rules;
  },

  // ── 301 redirects ────────────────────────────────────────────────────────
  // Permanent moves for paddle slugs that have been renamed. 301 transfers
  // SEO ranking signal from old URL → new URL. Keep this list pruned over
  // time, but never delete entries with active inbound link weight.
  async redirects() {
    return [
      // ── Paddle slug corrections ─────────────────────────────────────────────
      { source: '/paddles/luzz-glider-elongated', destination: '/paddles/luzz-glider-hybrid', permanent: true },
      // friday-aura-pro-elongated was never in the catalog; closest is friday-aura-elongated
      { source: '/paddles/friday-aura-pro-elongated', destination: '/paddles/friday-aura-elongated', permanent: true },
      // aireo-cyclone-hybrid was renamed to aireo-cyclone-usap-hybrid
      { source: '/paddles/aireo-cyclone-hybrid', destination: '/paddles/aireo-cyclone-usap-hybrid', permanent: true },
      // 11six24-ultre-power-2 elongated variant doesn't exist — redirect to hybrid
      { source: '/paddles/11six24-ultre-power-2-elongated', destination: '/paddles/11six24-ultre-power-2-hybrid', permanent: true },

      // ── Compare pages referencing friday-aura-pro-elongated ─────────────────
      { source: '/compare/friday-aura-pro-elongated-vs-joola-pro-v-perseus-elongated', destination: '/compare/friday-aura-elongated-vs-joola-pro-v-perseus-elongated', permanent: true },
      { source: '/compare/enhance-turbo-epp-hybrid-vs-friday-aura-pro-elongated', destination: '/compare/enhance-turbo-epp-hybrid-vs-friday-aura-elongated', permanent: true },
      { source: '/compare/bread-and-butter-loco-elongated-vs-friday-aura-pro-elongated', destination: '/compare/bread-and-butter-loco-elongated-vs-friday-aura-elongated', permanent: true },
      { source: '/compare/friday-aura-pro-elongated-vs-selkirk-boomstik-elongated', destination: '/compare/friday-aura-elongated-vs-selkirk-boomstik-elongated', permanent: true },
      { source: '/compare/friday-aura-pro-elongated-vs-selkirk-tesla-elongated', destination: '/compare/friday-aura-elongated-vs-selkirk-tesla-elongated', permanent: true },
      // Compare pages referencing mint-ghost-x-hybrid — redirect to correct slug
      { source: '/compare/enhance-turbo-epp-hybrid-vs-mint-ghost-x-hybrid', destination: '/compare/enhance-turbo-epp-hybrid-vs-mint-ghost-hybrid', permanent: true },
      { source: '/compare/mint-ghost-x-hybrid-vs-speedup-tide-14h-hybrid', destination: '/compare/mint-ghost-hybrid-vs-speedup-tide-14h-hybrid', permanent: true },

      // Compare pages referencing luzz-cannon-elongated — redirect to xpp slug
      { source: '/compare/luzz-cannon-elongated-vs-slk-halo-pro-elongated', destination: '/compare/luzz-cannon-xpp-elongated-vs-slk-halo-pro-elongated', permanent: true },

      // Additional compare pages referencing friday-aura-pro-elongated
      { source: '/compare/bread-and-butter-loco-hybrid-vs-friday-aura-pro-elongated', destination: '/compare/bread-and-butter-loco-hybrid-vs-friday-aura-elongated', permanent: true },
      { source: '/compare/bread-and-butter-filth-elongated-vs-friday-aura-pro-elongated', destination: '/compare/bread-and-butter-filth-elongated-vs-friday-aura-elongated', permanent: true },
      { source: '/compare/friday-aura-pro-elongated-vs-luzz-glider-hybrid', destination: '/compare/friday-aura-elongated-vs-luzz-glider-hybrid', permanent: true },
      { source: '/compare/crbn-trufoam-barrage-1-elongated-vs-friday-aura-pro-elongated', destination: '/compare/crbn-trufoam-barrage-1-elongated-vs-friday-aura-elongated', permanent: true },

      // Series slug correction — friday-aura-pro never existed as a series
      { source: '/series/friday-aura-pro', destination: '/series/friday-aura', permanent: true },

      // ── Blog slug correction ─────────────────────────────────────────────────
      { source: '/blog/honolulu-crystal-blue-review', destination: '/blog/honolulu-j2cr-crystal-blue-review', permanent: true },

      // ── Gear — no academy product exists ────────────────────────────────────
      { source: '/gear/academy', destination: '/gear', permanent: true },

      // ── Newsletter route rename — /playbook → /pickleball-101 ───────────────
      { source: '/playbook', destination: '/pickleball-101', permanent: true },
      { source: '/playbook/:slug*', destination: '/pickleball-101/:slug*', permanent: true },
    ];
  },
};

module.exports = nextConfig;
