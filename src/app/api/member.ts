import { asRecord, isObjectId, requestApi, uploadImage } from "./client"

export type Member = {
  id: string
  type: "ADMIN" | "USER" | "RESTAURANT" | null
  name: string
  phone: string
  address: string
  description: string
  image: string
}

type Credentials = { name: string; password: string }
type ProfileFields = Pick<Member, "name" | "phone" | "address" | "description">

export class MemberApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "MemberApiError"
    this.status = status
  }
}

function readMember(value: unknown): Member {
  const member = asRecord(value)
  const { _id: id, memberImage, memberType: type } = member
  if (!isObjectId(id) || typeof member.memberNick !== "string") {
    throw new Error("The Burak API returned invalid member data.")
  }
  return {
    id,
    type: type === "ADMIN" || type === "USER" || type === "RESTAURANT" ? type : null,
    name: member.memberNick,
    phone: typeof member.memberPhone === "string" ? member.memberPhone : "",
    address:
      typeof member.memberAddress === "string" ? member.memberAddress : "",
    description: typeof member.memberDesc === "string" ? member.memberDesc : "",
    image: memberAvatar(memberImage),
  }
}

function memberAvatar(value: unknown): string {
  if (typeof value !== "string") return "/icons/default-user.svg"
  const path = value.trim().replace(/^\.\//, "")
  const isFilename = /^[\w.-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(path)
  return uploadImage(isFilename ? `uploads/members/${path}` : path) ?? "/icons/default-user.svg"
}

async function checkStatus(response: Response, fallback: string) {
  if (response.ok) return

  const error = new MemberApiError(response.status, fallback)
  if (response.status < 400 || response.status >= 500) throw error
  const data: unknown = await response.json().catch(() => null)
  const { message } = asRecord(data)
  throw typeof message === "string" && message.trim() && message.length < 300
    ? new MemberApiError(response.status, message)
    : error
}

function postMember(
  path: string,
  input: Record<string, string> | FormData,
  signal?: AbortSignal,
) {
  const multipart = input instanceof FormData
  return requestApi(path, {
    method: "POST",
    credentials: "include",
    headers: multipart ? undefined : { "Content-Type": "application/json" },
    body: multipart ? input : JSON.stringify(input),
    signal,
  })
}

export async function getCurrentMember(signal?: AbortSignal) {
  const response = await requestApi("/member/detail", {
    credentials: "include",
    cache: "no-store",
    signal,
  })
  if ([401, 403, 404].includes(response.status)) return null
  await checkStatus(response, "Your session could not be checked. Try again.")
  return readMember(await response.json())
}

export async function login({ name, password }: Credentials) {
  const response = await postMember("/member/login", {
    memberNick: name,
    memberPassword: password,
  })
  if (response.status === 401 || response.status === 404) {
    throw new MemberApiError(
      response.status,
      "Check your nickname and password.",
    )
  }
  await checkStatus(response, "Could not log in. Try again.")
  return readMember(asRecord(await response.json()).member)
}

export async function signup({
  name,
  phone,
  password,
}: Credentials & { phone: string }) {
  const response = await postMember("/member/signup", {
    memberNick: name,
    memberPhone: phone,
    memberPassword: password,
  })
  await checkStatus(response, "Could not create your account. Try again.")
  return readMember(asRecord(await response.json()).member)
}

export async function logoutMember() {
  const response = await postMember("/member/logout", {})
  if (response.status === 401 || response.status === 403) return
  await checkStatus(response, "Could not log out. Try again.")
}

export async function updateMember(
  values: ProfileFields,
  image?: File,
  signal?: AbortSignal,
) {
  const fields = {
    memberNick: values.name,
    memberPhone: values.phone,
    memberAddress: values.address,
    memberDesc: values.description,
  }

  let input: Record<string, string> | FormData = fields
  if (image) {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) form.set(key, value)
    form.set("memberImage", image)
    input = form
  }
  const response = await postMember("/member/update", input, signal)
  await checkStatus(response, "Could not save your profile. Try again.")
  return readMember(await response.json())
}

export async function getRestaurant(
  signal?: AbortSignal,
): Promise<Member | null> {
  const response = await requestApi("/member/restaurant", { signal })
  if (response.status === 404) return null
  await checkStatus(response, "Could not load restaurant information.")
  return readMember(await response.json())
}
