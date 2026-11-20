export type Product = {
  id: string
  name: string
  image: string
  category: string
  price: number
  views: number
  stock: number
  description: string
  size: string
  createdAt: string
}

export type PublicUser = {
  id: string
  name: string
  image: string
}

const configuredBase = import.meta.env.VITE_BURAK_API_BASE_URL?.trim() || "/api"
const basePath = configuredBase.replace(/^\/+|\/+$/g, "")
const absoluteBase = /^https?:\/\//i.test(basePath)
const apiBase = basePath && !absoluteBase ? `/${basePath}` : basePath
const pageSize = 100

function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function uploadImage(value: unknown): string | undefined {
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

function readProduct(value: unknown): Product {
  const product = asRecord(value)
  const { _id: id, productImages, productViews, productLeftCount } = product
  if (
    !isObjectId(id) ||
    typeof product.productName !== "string" ||
    !product.productName.trim() ||
    typeof product.productCollection !== "string" ||
    typeof product.productPrice !== "number" ||
    !Number.isFinite(product.productPrice) ||
    product.productPrice < 0
  ) {
    throw new Error("The Burak API returned invalid product data.")
  }
  const image = Array.isArray(productImages)
    ? productImages.map(uploadImage).find(Boolean)
    : undefined

  return {
    id,
    name: product.productName,
    category: product.productCollection,
    price: product.productPrice,
    views:
      typeof productViews === "number" && Number.isFinite(productViews)
        ? productViews
        : 0,
    stock:
      typeof productLeftCount === "number" && Number.isFinite(productLeftCount)
        ? Math.max(0, Math.floor(productLeftCount))
        : 0,
    image: image || "/icons/noimage-list.svg",
    description:
      typeof product.productDesc === "string" ? product.productDesc : "",
    size: typeof product.productSize === "string" ? product.productSize : "",
    createdAt: typeof product.createdAt === "string" ? product.createdAt : "",
  }
}

function request(path: string, signal?: AbortSignal) {
  return fetch(`${apiBase}${path}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    signal,
  })
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`The Burak API request failed (${response.status}).`)
  }
  return response.json()
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const products = new Map<string, Product>()

  for (let page = 1; ; page += 1) {
    signal?.throwIfAborted()
    const data = await readJson(
      await request(`/product/all?page=${page}&limit=${pageSize}`, signal),
    )
    if (!Array.isArray(data)) {
      throw new Error("The Burak API returned an invalid product list.")
    }

    const previousSize = products.size
    for (const entry of data) {
      const product = readProduct(entry)
      products.set(product.id, product)
    }
    if (data.length < pageSize || products.size === previousSize) {
      return [...products.values()]
    }
  }
}

export async function getProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product | null> {
  if (!isObjectId(id)) return null
  const response = await request(`/product/${id}`, signal)
  if (response.status === 404 || response.status === 204) return null
  const data = await readJson(response)
  return data === null ? null : readProduct(data)
}

export async function getTopUsers(signal?: AbortSignal): Promise<PublicUser[]> {
  const data = await readJson(await request("/member/top-users", signal))
  if (!Array.isArray(data)) {
    throw new Error("The Burak API returned an invalid member list.")
  }
  return data.map(entry => {
    const { _id: id, memberNick, memberImage } = asRecord(entry)
    if (!isObjectId(id) || typeof memberNick !== "string") {
      throw new Error("The Burak API returned invalid member data.")
    }
    return {
      id,
      name: memberNick,
      image: uploadImage(memberImage) || "/icons/default-user.svg",
    }
  })
}
