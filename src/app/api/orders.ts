import { asRecord, isObjectId, requestApi, uploadImage } from "./client"

const statuses = ["PAUSE", "PROCESS", "FINISH", "DELETE"] as const

export type OrderStatus = (typeof statuses)[number]

export type OrderItem = {
  id: string
  productId: string
  quantity: number
  price: number
  name: string
  image: string
}

export type Order = {
  id: string
  status: OrderStatus
  total: number
  delivery: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

type OrderItemInput = { productId: string; itemQuantity: number }
type OrderInquiry = { orderStatus?: OrderStatus; page: number; limit: number }

export class OrderApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "OrderApiError"
    this.status = status
  }
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return statuses.some(status => status === value)
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function readOrder(rawOrder: unknown): Order {
  const {
    _id: id,
    orderStatus: status,
    orderTotal: total,
    orderDelivery: delivery,
    createdAt,
    updatedAt,
    orderItems,
    productData,
  } = asRecord(rawOrder)

  if (
    !isObjectId(id) ||
    !isOrderStatus(status) ||
    !isAmount(total) ||
    !isAmount(delivery)
  ) {
    throw new Error("The Burak API returned invalid order data.")
  }

  const productsById = new Map<string, Record<string, unknown>>()
  if (Array.isArray(productData)) {
    for (const rawProduct of productData) {
      const product = asRecord(rawProduct)
      const { _id: productId } = product
      if (isObjectId(productId)) productsById.set(productId, product)
    }
  }

  // Creation and update return only the order. The list endpoint joins its items and products.
  const items = Array.isArray(orderItems)
    ? orderItems.map(rawItem => {
        const {
          _id: itemId,
          productId,
          itemPrice: price,
          itemQuantity: quantity,
        } = asRecord(rawItem)
        if (
          !isObjectId(itemId) ||
          !isObjectId(productId) ||
          !isAmount(price) ||
          typeof quantity !== "number" ||
          !Number.isSafeInteger(quantity) ||
          quantity < 1
        ) {
          throw new Error("The Burak API returned invalid order item data.")
        }

        const product = productsById.get(productId)
        const images = product?.productImages
        const image = Array.isArray(images)
          ? images.map(uploadImage).find(value => value !== undefined)
          : undefined

        return {
          id: itemId,
          productId,
          quantity,
          price,
          name:
            typeof product?.productName === "string" &&
            product.productName.trim()
              ? product.productName
              : "Unavailable product",
          image: image ?? "/icons/noimage-list.svg",
        }
      })
    : []

  return {
    id,
    status,
    total,
    delivery,
    createdAt: typeof createdAt === "string" ? createdAt : "",
    updatedAt: typeof updatedAt === "string" ? updatedAt : "",
    items,
  }
}

async function readJson(
  response: Response,
  fallback: string,
): Promise<unknown> {
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      const { message } = asRecord(await response.json().catch(() => null))
      if (
        typeof message === "string" &&
        message.trim() &&
        message.length < 300
      ) {
        throw new OrderApiError(response.status, message)
      }
    }
    throw new OrderApiError(response.status, fallback)
  }
  return response.json()
}

function postOrder(
  path: string,
  body: OrderItemInput[] | { orderId: string; orderStatus: OrderStatus },
  signal?: AbortSignal,
) {
  return requestApi(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
}

export async function createOrder(
  items: OrderItemInput[],
  signal?: AbortSignal,
): Promise<Order> {
  const body = items.map(({ productId, itemQuantity }) => ({
    productId,
    itemQuantity,
  }))
  const response = await postOrder("/order/create", body, signal)
  return readOrder(await readJson(response, "Could not place your order."))
}

export async function getOrders(
  inquiry: OrderInquiry,
  signal?: AbortSignal,
): Promise<Order[]> {
  const params = new URLSearchParams({
    page: String(inquiry.page),
    limit: String(inquiry.limit),
  })
  if (inquiry.orderStatus) params.set("orderStatus", inquiry.orderStatus)

  const response = await requestApi(`/order/all?${params}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  })
  const data = await readJson(response, "Could not load your orders.")
  if (!Array.isArray(data)) {
    throw new Error("The Burak API returned an invalid order list.")
  }
  return data.map(readOrder)
}

export async function updateOrder(
  orderId: string,
  orderStatus: Exclude<OrderStatus, "PAUSE">,
  signal?: AbortSignal,
): Promise<Order> {
  const response = await postOrder(
    "/order/update",
    { orderId, orderStatus },
    signal,
  )
  return readOrder(await readJson(response, "Could not update your order."))
}
