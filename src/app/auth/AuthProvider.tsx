import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { getCurrentMember, logoutMember, MemberApiError } from "../api/member"
import type { Member } from "../api/member"
import type { AuthMode } from "./AuthDialog"

const AuthDialog = lazy(() => import("./AuthDialog"))

type Session =
  | { status: "loading" | "guest" | "error"; member: null }
  | { status: "authenticated"; member: Member }

type AuthState = Session & {
  openLogin: () => void
  openSignup: () => void
  logout: () => Promise<void>
  error: string
  isLoggingOut: boolean
  setMember: (member: Member | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    status: "loading",
    member: null,
  })
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [error, setError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const sessionRequest = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    sessionRequest.current = controller
    const { signal } = controller

    void getCurrentMember(signal).then(
      member => {
        if (signal.aborted) return
        setSession(
          member
            ? { status: "authenticated", member }
            : { status: "guest", member: null },
        )
      },
      () => {
        if (signal.aborted) return
        setSession({ status: "error", member: null })
      },
    )
    return () => controller.abort()
  }, [])

  function finishAuthentication(member: Member) {
    sessionRequest.current?.abort()
    setSession({ status: "authenticated", member })
    setError("")
    setMode(null)
  }

  function setMember(member: Member | null) {
    if (!member) {
      sessionRequest.current?.abort()
      setSession({ status: "guest", member: null })
      return
    }
    setSession(current =>
      current.member?.id === member.id
        ? { status: "authenticated", member }
        : current,
    )
  }

  async function logout() {
    if (!session.member || isLoggingOut) return
    setError("")
    setIsLoggingOut(true)
    try {
      await logoutMember()
      setMember(null)
    } catch (err) {
      setError(
        err instanceof MemberApiError
          ? err.message
          : "Could not log out. Try again.",
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...session,
        openLogin: () => setMode("login"),
        openSignup: () => setMode("signup"),
        logout,
        error,
        isLoggingOut,
        setMember,
      }}
    >
      {children}
      {mode && (
        <Suspense fallback={<output className="sr-only">Opening account form…</output>}>
          <AuthDialog
            key={mode}
            mode={mode}
            onClose={() => setMode(null)}
            onModeChange={setMode}
            onAuthenticated={finishAuthentication}
          />
        </Suspense>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error("AuthProvider is required")
  return auth
}
