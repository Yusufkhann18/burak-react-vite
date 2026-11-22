import { asRecord, isObjectId, requestApi, uploadImage } from "./client"

export type Product = {
  id: string
  name: string
  image: string
  images: string[]
  category: string
  price: number
  views: number
  stock: number
  description: string
  size: string
  volume?: number
  createdAt: string
}

export type PublicUser = {
  id: string
  name: string
  image: string
}

export const productCollections = ["DISH", "SALAD", "DRINK", "DESERT", "OTHER"] as const
export const menuPageSize = 8
export const maxProductSearchLength = 120

type ProductCollection = (typeof productCollections)[number]
type ProductOrder = "createdAt" | "productPrice" | "productViews"
const catalogPageSize = 100
const noProductImage = "/icons/noimage-list.svg"

function readProduct(value: unknown): Product {
  const product = asRecord(value)
  const { _id: id, productImages, productViews, productLeftCount, productVolume } = product
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
  const images = Array.isArray(productImages)
    ? [...new Set(productImages.map(uploadImage).filter(image => image !== undefined))]
    : []

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
    image: images[0] ?? noProductImage,
    images: images.length ? images : [noProductImage],
    description:
      typeof product.productDesc === "string" ? product.productDesc : "",
    size: typeof product.productSize === "string" ? product.productSize : "",
    volume:
      typeof productVolume === "number" && Number.isFinite(productVolume) && productVolume > 0
        ? productVolume
        : undefined,
    createdAt: typeof product.createdAt === "string" ? product.createdAt : "",
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`The Burak API request failed (${response.status}).`)
  }
  return response.json()
}

async function getProductRows(params: URLSearchParams, signal?: AbortSignal): Promise<Product[]> {
  const data = await readJson(await requestApi(`/product/all?${params}`, { signal }))
  if (!Array.isArray(data)) {
    throw new Error("The Burak API returned an invalid product list.")
  }
  return data.map(readProduct)
}

type ProductInquiry = {
  page: number
  order: ProductOrder
  collection?: ProductCollection
  search: string
}

export async function getProductPage(inquiry: ProductInquiry, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(inquiry.page),
    limit: String(menuPageSize),
    order: inquiry.order,
  })
  if (inquiry.collection) params.set("productCollection", inquiry.collection)
  const search = inquiry.search.trim().slice(0, maxProductSearchLength)
  // The API interprets search as a regular expression. Match the entered text literally.
  if (search) params.set("search", search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

  const products = await getProductRows(params, signal)
  if (products.length < menuPageSize) return { products, hasNext: false }

  // The list response provides no total count. Check that the next page exists.
  params.set("page", String(inquiry.page + 1))
  const next = await getProductRows(params, signal)
  const visibleIds = new Set(products.map(({ id }) => id))
  return { products, hasNext: next.some(({ id }) => !visibleIds.has(id)) }
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const products = new Map<string, Product>()

  for (let page = 1; ; page += 1) {
    signal?.throwIfAborted()
    const data = await getProductRows(
      new URLSearchParams({ page: String(page), limit: String(catalogPageSize) }),
      signal,
    )

    const previousSize = products.size
    for (const product of data) products.set(product.id, product)
    if (data.length < catalogPageSize || products.size === previousSize) {
      return [...products.values()]
    }
  }
}

export async function getProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product | null> {
  if (!isObjectId(id)) return null
  const response = await requestApi(`/product/${id}`, { signal })
  if (response.status === 404 || response.status === 204) return null
  const data = await readJson(response)
  return data === null ? null : readProduct(data)
}

export async function getTopUsers(signal?: AbortSignal): Promise<PublicUser[]> {
  const data = await readJson(await requestApi("/member/top-users", { signal }))
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
