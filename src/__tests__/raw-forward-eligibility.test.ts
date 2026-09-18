// ============================================================
// Raw-forward eligibility (Cloudflare Free CPU passthrough)
// ============================================================
//
// On Cloudflare, the relay forwards the ORIGINAL request text upstream
// (skipping a costly JSON.stringify of large bodies) — but ONLY when the
// outgoing body is provably byte-equivalent to that original text. These
// tests pin every condition that must DISABLE raw forwarding, so a future
// change that rewrites the body without updating the predicate can't
// silently ship a wrong payload to upstream.

import { describe, it, expect } from 'vitest';
import { isRawForwardEligible } from '@/lib/relay';

// The eligible baseline: a request whose only change is (at most) a model
// swap that didn't actually change the model. Each test below flips exactly
// one rewrite condition and asserts forwarding is disabled.
const ELIGIBLE = {
  apiType: 'chat',
  isAnthropicProvider: false,
  modelChanged: false,
  injectStreamOptions: false,
} as const;

describe('isRawForwardEligible', () => {
  it('forwards when nothing rewrites the body (chat → openai, model unchanged)', () => {
    expect(isRawForwardEligible(ELIGIBLE)).toBe(true);
  });

  it('forwards for anthropicMessages → anthropic provider with unchanged model', () => {
    expect(
      isRawForwardEligible({
        apiType: 'anthropicMessages',
        isAnthropicProvider: true,
        modelChanged: false,
        injectStreamOptions: false,
      })
    ).toBe(true);
  });

  it('forwards for responses API with unchanged model', () => {
    expect(
      isRawForwardEligible({
        apiType: 'responses',
        isAnthropicProvider: false,
        modelChanged: false,
        injectStreamOptions: false,
      })
    ).toBe(true);
  });

  // ── Disable conditions ────────────────────────────────────

  it('disables forwarding when the upstream model changed (alias / mapping / fallback)', () => {
    expect(isRawForwardEligible({ ...ELIGIBLE, modelChanged: true })).toBe(false);
  });

  it('disables forwarding when stream_options.include_usage was injected', () => {
    expect(isRawForwardEligible({ ...ELIGIBLE, injectStreamOptions: true })).toBe(false);
  });

  it('disables forwarding for the chat → Anthropic transform', () => {
    expect(
      isRawForwardEligible({ ...ELIGIBLE, apiType: 'chat', isAnthropicProvider: true })
    ).toBe(false);
  });

  it('disables forwarding for the anthropicMessages → OpenAI transform', () => {
    expect(
      isRawForwardEligible({
        apiType: 'anthropicMessages',
        isAnthropicProvider: false,
        modelChanged: false,
        injectStreamOptions: false,
      })
    ).toBe(false);
  });

  it('disables forwarding when a fallback overrides the model (modelChanged) even on an otherwise-eligible path', () => {
    // Fallback with an explicit "provider:model" entry → modelChanged is true,
    // so the primary-only raw text must never be reused for the remapped body.
    expect(
      isRawForwardEligible({
        apiType: 'responses',
        isAnthropicProvider: false,
        modelChanged: true,
        injectStreamOptions: false,
      })
    ).toBe(false);
  });

  it('stays disabled when multiple rewrite conditions hold at once', () => {
    expect(
      isRawForwardEligible({
        apiType: 'chat',
        isAnthropicProvider: true,
        modelChanged: true,
        injectStreamOptions: true,
      })
    ).toBe(false);
  });

  it('disables raw forward when anthropic-style thinking is stripped for openai upstreams', () => {
    expect(
      isRawForwardEligible({
        apiType: 'chat',
        isAnthropicProvider: false,
        modelChanged: false,
        injectStreamOptions: false,
        strippedThinking: true,
      })
    ).toBe(false);
  });

  it('keeps raw forward eligible when no thinking stripping occurred (openai upstream)', () => {
    expect(
      isRawForwardEligible({
        apiType: 'chat',
        isAnthropicProvider: false,
        modelChanged: false,
        injectStreamOptions: false,
        strippedThinking: false,
      })
    ).toBe(true);
  });
});