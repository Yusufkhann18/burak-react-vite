import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material"
import { useId, useState } from "react"
import type { FormEvent } from "react"
import { login, MemberApiError, signup } from "../api/member"
import type { Member } from "../api/member"

export type AuthMode = "login" | "signup"

type AuthDialogProps = {
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onAuthenticated: (member: Member) => void
}

export default function AuthDialog({
  mode,
  onClose,
  onModeChange,
  onAuthenticated,
}: AuthDialogProps) {
  const titleId = useId()
  const signingUp = mode === "signup"
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const phone = String(form.get("phone") ?? "").trim()
    if (!name || !password || (signingUp && !phone)) {
      setError("Complete all required fields.")
      return
    }

    setError("")
    setBusy(true)
    try {
      const member = signingUp
        ? await signup({ name, phone, password })
        : await login({ name, password })
      onAuthenticated(member)
    } catch (err) {
      setError(
        err instanceof MemberApiError
          ? err.message
          : "Could not reach Burak. Try again.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      onClose={busy ? undefined : onClose}
    >
      <DialogTitle id={titleId}>{signingUp ? "Sign up" : "Log in"}</DialogTitle>
      <Box component="form" onSubmit={submit} aria-busy={busy}>
        <DialogContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <Box
              component="img"
              src="/img/auth.webp"
              alt=""
              sx={{
                display: { xs: "none", sm: "block" },
                width: "36%",
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
            <Stack spacing={2} sx={{ flex: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                name="name"
                label="Nickname"
                autoComplete="username"
                required
                disabled={busy}
              />
              {signingUp && (
                <TextField
                  name="phone"
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  disabled={busy}
                />
              )}
              <TextField
                name="password"
                label="Password"
                type="password"
                autoComplete={signingUp ? "new-password" : "current-password"}
                required
                disabled={busy}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", rowGap: 1, px: 3 }}>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onModeChange(signingUp ? "login" : "signup")}
            sx={{ mr: "auto" }}
          >
            {signingUp ? "Log in instead" : "Create an account"}
          </Button>
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Please wait…" : signingUp ? "Create account" : "Log in"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
