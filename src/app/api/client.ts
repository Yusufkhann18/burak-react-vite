const configuredBase = import.meta.env.VITE_BURAK_API_BASE_URL?.trim() || "/api"
const basePath = configuredBase.replace(/^\/+|\/+$/g, "")
const absoluteBase = /^https?:\/\//i.test(basePath)
const apiBase = basePath && !absoluteBase ? `/${basePath}` : basePath

export function requestApi(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  return fetch(`${apiBase}${path}`, {
    credentials: "same-origin",
    ...init,
    headers,
  })
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
}

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function uploadImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const parts = value.trim().replace(/\\/g, "/").replace(/^\/+/, "").split("/")
  if (
    parts[0] !== "uploads" ||
    parts.length < 2 ||
    parts.some(part => !part || part === "." || part === "..")
  ) {
    return undefined
  }
  try {
    const pathname = `/${parts.map(part => encodeURIComponent(part)).join("/")}`
    return absoluteBase ? new URL(pathname, apiBase).href : pathname
  } catch {
    return undefined
  }
}
