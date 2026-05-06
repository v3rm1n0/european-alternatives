import { describe, expect, it } from 'vitest'

const expectedHstsValue = 'max-age=31536000; includeSubDomains; preload'
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

type LiveHeaderCheck = {
  label: string
  method?: 'GET' | 'HEAD'
  path: string
  expectedStatus: number
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
        'EUROALT_LIVE_BASE_URL must use https:// so deployment verification matches the HSTS-enforced origin.',
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

async function fetchLiveHeaders(
  path: string,
  method: 'GET' | 'HEAD' = 'GET',
): Promise<Response> {
  if (!liveOriginConfig.origin) {
    throw new Error('Live HSTS smoke test requested without EUROALT_LIVE_BASE_URL.')
  }

  const response = await fetch(new URL(path, liveOriginConfig.origin), {
    method,
    redirect: 'manual',
  })

  await response.arrayBuffer()

  return response
}

function formatHeaderSnapshot(response: Response): string {
  const interestingHeaders = [
    'strict-transport-security',
    'setifempty',
    'location',
    'server',
  ]
  const details = interestingHeaders
    .map((name) => `${name}=${JSON.stringify(response.headers.get(name))}`)
    .join(', ')

  return details
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function waitForLiveHeaderCheck(
  check: LiveHeaderCheck,
  deadline: number,
): Promise<string | null> {
  let attempts = 0
  let lastFailure: string

  while (true) {
    attempts += 1

    try {
      const response = await fetchLiveHeaders(check.path, check.method)
      const actualHstsValue = response.headers.get('strict-transport-security')
      const mismatches: string[] = []

      if (response.status === check.expectedStatus) {
        if (actualHstsValue === expectedHstsValue) {
          return null
        }
      } else {
        mismatches.push(
          `status ${response.status} instead of ${check.expectedStatus}`,
        )
      }

      if (actualHstsValue !== expectedHstsValue) {
        mismatches.push(
          `Strict-Transport-Security ${JSON.stringify(actualHstsValue)} instead of ${JSON.stringify(expectedHstsValue)}`,
        )
      }

      if (mismatches.length === 0) {
        return null
      }

      lastFailure = [
        `${check.method ?? 'GET'} ${check.path} returned ${mismatches.join(' and ')}.`,
        `Observed headers: ${formatHeaderSnapshot(response)}.`,
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

describe('live HSTS deployment smoke test configuration', () => {
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

describeIfLive('live HSTS deployment smoke test', () => {
  const checks: LiveHeaderCheck[] = [
    { label: 'the root document', path: '/', expectedStatus: 200 },
    { label: 'a static asset', path: '/favicon.svg', expectedStatus: 200 },
    {
      label: 'a direct file served from /api',
      path: '/api/README.md',
      expectedStatus: 200,
    },
    {
      label: 'a public API route rewritten to PHP',
      method: 'HEAD',
      path: '/api/catalog/entries?status=alternative',
      expectedStatus: 405,
    },
    {
      label: 'an Apache-generated API 404',
      path: '/api/catalog/does-not-exist',
      expectedStatus: 404,
    },
  ]

  it(
    'returns a real HSTS header for the public root, static, API, and 404 coverage set',
    async () => {
      const deadline = Date.now() + liveRetryConfig.timeoutMs
      const failures: string[] = []

      for (const check of checks) {
        const failure = await waitForLiveHeaderCheck(check, deadline)
        if (failure) {
          failures.push(failure)
        }
      }

      expect(failures).toEqual([])
    },
    Math.max(liveRetryConfig.timeoutMs + 30_000, 30_000),
  )
})
