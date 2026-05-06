import { describe, expect, it } from 'vitest'

import {
  enforcedCspPolicy,
  expectFallbackShellCspCompatibility,
  expectMainAppShellCspCompatibility,
} from './support/html-csp'

const liveOriginConfig = parseLiveOrigin(process.env.EUROALT_LIVE_BASE_URL)
const liveRetryConfig = parseLiveRetryConfig({
  timeout: process.env.EUROALT_LIVE_VERIFY_TIMEOUT_MS,
  interval: process.env.EUROALT_LIVE_VERIFY_INTERVAL_MS,
})

type LiveOriginConfig = {
  origin?: string
  error?: string
}

type LiveRetryConfig = {
  timeoutMs: number
  intervalMs: number
  error?: string
}

type LiveHtmlCheck = {
  label: string
  path: string
  expectedStatus: number
  assertHtml: (html: string) => void
}

function parseLiveOrigin(value: string | undefined): LiveOriginConfig {
  if (!value) {
    return {}
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return {
      error:
        'EUROALT_LIVE_BASE_URL must be a valid https:// origin without a path, query, or hash.',
    }
  }

  if (url.protocol !== 'https:') {
    return {
      error:
        'EUROALT_LIVE_BASE_URL must use https:// so deployment verification matches the enforced CSP origin.',
    }
  }

  if (url.pathname !== '/' || url.search.length > 0 || url.hash.length > 0) {
    return {
      error:
        'EUROALT_LIVE_BASE_URL must be an origin only, for example https://european-alternatives.cloud.',
    }
  }

  return { origin: url.origin }
}

function parseNonNegativeInteger(
  value: string | undefined,
  envName: string,
): { value?: number; error?: string } {
  if (value === undefined) {
    return {}
  }

  if (!/^\d+$/u.test(value)) {
    return {
      error: `${envName} must be a non-negative integer number of milliseconds.`,
    }
  }

  return { value: Number.parseInt(value, 10) }
}

function parsePositiveInteger(
  value: string | undefined,
  envName: string,
): { value?: number; error?: string } {
  const parsed = parseNonNegativeInteger(value, envName)

  if (parsed.error) {
    return parsed
  }

  if (parsed.value === undefined) {
    return {}
  }

  if (parsed.value === 0) {
    return {
      error: `${envName} must be greater than 0 milliseconds.`,
    }
  }

  return parsed
}

function parseLiveRetryConfig(env: {
  timeout: string | undefined
  interval: string | undefined
}): LiveRetryConfig {
  const timeout = parseNonNegativeInteger(
    env.timeout,
    'EUROALT_LIVE_VERIFY_TIMEOUT_MS',
  )
  if (timeout.error) {
    return { timeoutMs: 0, intervalMs: 1_000, error: timeout.error }
  }

  const interval = parsePositiveInteger(
    env.interval,
    'EUROALT_LIVE_VERIFY_INTERVAL_MS',
  )
  if (interval.error) {
    return { timeoutMs: 0, intervalMs: 1_000, error: interval.error }
  }

  return {
    timeoutMs: timeout.value ?? 0,
    intervalMs: interval.value ?? 1_000,
  }
}

async function fetchLiveDocument(
  path: string,
): Promise<{ response: Response; html: string }> {
  if (!liveOriginConfig.origin) {
    throw new Error('Live CSP smoke test requested without EUROALT_LIVE_BASE_URL.')
  }

  const response = await fetch(new URL(path, liveOriginConfig.origin), {
    method: 'GET',
    redirect: 'manual',
  })
  const html = await response.text()

  return { response, html }
}

function formatHeaderSnapshot(response: Response): string {
  const interestingHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'location',
    'server',
  ]
  return interestingHeaders
    .map((name) => `${name}=${JSON.stringify(response.headers.get(name))}`)
    .join(', ')
}

function formatHtmlSnippet(html: string): string {
  return JSON.stringify(html.replace(/\s+/gu, ' ').trim().slice(0, 240))
}

function getHtmlAssertionFailure(
  html: string,
  assertHtml: (html: string) => void,
): string | null {
  try {
    assertHtml(html)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function waitForLiveHtmlCheck(
  check: LiveHtmlCheck,
  deadline: number,
): Promise<string | null> {
  let attempts = 0
  let lastFailure: string

  while (true) {
    attempts += 1

    try {
      const { response, html } = await fetchLiveDocument(check.path)
      const actualCspValue = response.headers.get('content-security-policy')
      const mismatches: string[] = []

      if (response.status !== check.expectedStatus) {
        mismatches.push(
          `status ${response.status} instead of ${check.expectedStatus}`,
        )
      }

      if (actualCspValue !== enforcedCspPolicy) {
        mismatches.push(
          `Content-Security-Policy ${JSON.stringify(actualCspValue)} instead of ${JSON.stringify(enforcedCspPolicy)}`,
        )
      }

      const htmlFailure = getHtmlAssertionFailure(html, check.assertHtml)
      if (htmlFailure) {
        mismatches.push(`HTML assertions failed: ${htmlFailure}`)
      }

      if (mismatches.length === 0) {
        return null
      }

      lastFailure = [
        `${check.path} returned ${mismatches.join(' and ')}.`,
        `Observed headers: ${formatHeaderSnapshot(response)}.`,
        `Observed HTML snippet: ${formatHtmlSnippet(html)}.`,
      ].join(' ')
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error)
    }

    const remainingMs = deadline - Date.now()
    if (remainingMs <= 0) {
      return `${check.label} failed after ${attempts} attempt(s). ${lastFailure}`
    }

    await sleep(Math.min(liveRetryConfig.intervalMs, remainingMs))
  }
}

describe('live CSP deployment smoke test configuration', () => {
  it('stays disabled by default unless a live https origin is provided', () => {
    if (!process.env.EUROALT_LIVE_BASE_URL) {
      expect(liveOriginConfig).toEqual({})
      return
    }

    expect(liveOriginConfig.error).toBeUndefined()
    expect(liveOriginConfig.origin).toMatch(/^https:\/\//u)
  })

  it('accepts optional retry timing for post-deploy propagation checks', () => {
    expect(liveRetryConfig.error).toBeUndefined()
    expect(liveRetryConfig.timeoutMs).toBeGreaterThanOrEqual(0)
    expect(liveRetryConfig.intervalMs).toBeGreaterThan(0)
  })
})

const describeIfLive = liveOriginConfig.origin ? describe : describe.skip

describeIfLive('live CSP deployment smoke test', () => {
  const checks: LiveHtmlCheck[] = [
    {
      label: 'the root document',
      path: '/',
      expectedStatus: 200,
      assertHtml: expectMainAppShellCspCompatibility,
    },
    {
      label: 'the static 404 fallback',
      path: '/404.html',
      expectedStatus: 200,
      assertHtml: expectFallbackShellCspCompatibility,
    },
  ]

  it(
    'returns strict CSP headers and CSP-compatible HTML for the live root and 404 fallback',
    async () => {
      const deadline = Date.now() + liveRetryConfig.timeoutMs
      const failures: string[] = []

      for (const check of checks) {
        const failure = await waitForLiveHtmlCheck(check, deadline)
        if (failure) {
          failures.push(failure)
        }
      }

      expect(failures).toEqual([])
    },
    Math.max(liveRetryConfig.timeoutMs + 30_000, 30_000),
  )
})
