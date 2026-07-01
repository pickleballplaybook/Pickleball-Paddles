/**
 * Generate long-form SEO content (overview + useCases) for every gear product.
 *
 * Reads gearProducts from src/data/products.ts, calls Claude Haiku 4.5 once
 * per product, and writes the result to src/data/gear-content.json. The page
 * imports that JSON at build time.
 *
 * The system prompt is sent with cache_control so 16 calls share one cache
 * read (huge cost savings on repeat runs).
 *
 * Usage:
 *   npm run gen:gear-content              # generate only missing products
 *   npm run gen:gear-content -- --force   # regenerate all products
 *   npm run gen:gear-content -- --only=titan,r4lly   # regenerate listed ids
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";
import { gearProducts, type GearProduct } from "../src/data/products";

const MODEL = "claude-haiku-4-5-20251001";
const OUTPUT = path.resolve(__dirname, "../src/data/gear-content.json");

const FORCE = process.argv.includes("--force");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;

interface GeneratedContent {
  overview: string;
  useCases: { title: string; description: string }[];
}

const SYSTEM_PROMPT = `You write long-form, SEO-optimized product overviews for Pickleball Playbook (playbookpaddles.com), a pickleball gear review site run by Austin Hardy.

Voice:
- Expert but approachable — like a knowledgeable friend talking to a serious pickleball player
- Honest and specific — call out tradeoffs, not just benefits
- No hype words ("amazing", "revolutionary", "game-changing", "ultimate", "unleash")
- Naturally include phrases shoppers search for, without keyword stuffing

Output requirements:
- Return ONLY valid JSON. No prose before or after. No markdown code fences.
- Shape:
  {
    "overview": "single string, paragraphs separated by \\n\\n",
    "useCases": [
      { "title": "3-6 word headline", "description": "1-2 sentence explanation" }
    ]
  }

Overview rules:
- 250-400 words total
- 3-5 paragraphs separated by blank lines (\\n\\n)
- Cover, in roughly this order: what the product is, who it's for, its biggest strengths, its honest tradeoffs/limits, and a "should you buy it" close
- Use specific facts from the product data — DO NOT invent specs, prices, features, or claims not in the data
- No headings, no bullets, no markdown — flowing prose only
- Include natural long-tail phrases a real shopper would Google (e.g., "best pickleball ball machine for drills", "are carbon fiber insoles worth it")

useCases rules:
- Exactly 3-4 entries
- Each title is 3-6 words describing a real player type or scenario (e.g., "Solo drilling sessions", "Tennis converts with knee issues", "Tournament court setups")
- Each description is 1-2 sentences explaining why this specific product fits that user
- Focus on long-tail SEO intent

CRITICAL: Only assert things you can verify from the provided product data. If a fact isn't there, omit it.`;

async function generateForProduct(client: Anthropic, product: GearProduct): Promise<GeneratedContent> {
  const productContext = {
    brand: product.brand,
    name: product.name,
    subtitle: product.subtitle,
    description: product.description ?? null,
    features: product.features ?? null,
    specs: product.specs ?? null,
    highlights: product.highlights ?? null,
    bestFor: product.bestFor ?? null,
    faqs: product.faqs ?? null,
    price: product.price,
  };

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate the JSON for this product:\n\n${JSON.stringify(productContext, null, 2)}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected response block type: ${block.type}`);
  }

  const text = block.text.trim();
  const parsed = JSON.parse(text) as GeneratedContent;

  if (typeof parsed.overview !== "string" || !Array.isArray(parsed.useCases)) {
    throw new Error("Generated content failed shape validation");
  }

  return parsed;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local and run with `npm run gen:gear-content`.");
    process.exit(1);
  }

  const client = new Anthropic();
  const existing: Record<string, GeneratedContent> = existsSync(OUTPUT)
    ? JSON.parse(readFileSync(OUTPUT, "utf-8"))
    : {};

  const queue = gearProducts.filter((p) => {
    if (ONLY) return ONLY.includes(p.id);
    if (FORCE) return true;
    return !existing[p.id];
  });

  if (queue.length === 0) {
    console.log("Nothing to generate. Use --force to regenerate all, or --only=<id,id> to target specific products.");
    return;
  }

  console.log(`Generating content for ${queue.length} of ${gearProducts.length} gear products with ${MODEL}.`);

  for (const product of queue) {
    process.stdout.write(`  ${product.id.padEnd(24)} `);
    try {
      const content = await generateForProduct(client, product);
      existing[product.id] = content;
      writeFileSync(OUTPUT, JSON.stringify(existing, null, 2) + "\n");
      console.log("✓");
    } catch (err) {
      console.log(`✗ ${(err as Error).message}`);
    }
  }

  console.log(`\nWrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
