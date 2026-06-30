/**
 * Provider registry. Resolves which text/image provider to use based on env.
 * Priority: env-selected provider → first available → local fallback.
 * The UI never touches this file.
 */

import type { TextProvider, ImageProvider } from "./types";
import { localTextProvider, localImageProvider } from "./providers/local";
import { makeAnthropicTextProvider } from "./providers/anthropic";
import { makeOpenAITextProvider, makeOpenAIImageProvider } from "./providers/openai";
import { makeFalImageProvider } from "./providers/fal";
import { makeReplicateImageProvider } from "./providers/replicate";
import { makeIdeogramImageProvider } from "./providers/ideogram";

function env(key: string): string | undefined {
  return process.env[key] ?? undefined;
}

// ─── Text providers ───────────────────────────────────────────────────────────

function buildTextProviders(): TextProvider[] {
  const providers: TextProvider[] = [];
  const anthropicKey = env("ANTHROPIC_API_KEY");
  const openaiKey = env("OPENAI_API_KEY");
  const preferred = env("TEXT_PROVIDER");

  if (anthropicKey) providers.push(makeAnthropicTextProvider(anthropicKey));
  if (openaiKey) providers.push(makeOpenAITextProvider(openaiKey));
  providers.push(localTextProvider);

  if (preferred) {
    const found = providers.find((p) => p.id === preferred);
    if (found) return [found, ...providers.filter((p) => p.id !== preferred)];
  }

  return providers;
}

// ─── Image providers ──────────────────────────────────────────────────────────

function buildImageProviders(): ImageProvider[] {
  const providers: ImageProvider[] = [];
  const falKey = env("FAL_API_KEY");
  const openaiKey = env("OPENAI_API_KEY");
  const replicateKey = env("REPLICATE_API_KEY");
  const ideogramKey = env("IDEOGRAM_API_KEY");
  const preferred = env("IMAGE_PROVIDER");

  if (falKey) providers.push(makeFalImageProvider(falKey));
  if (openaiKey) providers.push(makeOpenAIImageProvider(openaiKey));
  if (replicateKey) providers.push(makeReplicateImageProvider(replicateKey));
  if (ideogramKey) providers.push(makeIdeogramImageProvider(ideogramKey));
  providers.push(localImageProvider);

  if (preferred) {
    const found = providers.find((p) => p.id === preferred);
    if (found) return [found, ...providers.filter((p) => p.id !== preferred)];
  }

  return providers;
}

// Memoize for the lifetime of the server process (not per-request)
let _textProviders: TextProvider[] | null = null;
let _imageProviders: ImageProvider[] | null = null;

export function getTextProviders(): TextProvider[] {
  return (_textProviders ??= buildTextProviders());
}

export function getImageProviders(): ImageProvider[] {
  return (_imageProviders ??= buildImageProviders());
}

export function getPrimaryTextProvider(): TextProvider {
  return getTextProviders()[0]!;
}

export function getPrimaryImageProvider(): ImageProvider {
  return getImageProviders()[0]!;
}
