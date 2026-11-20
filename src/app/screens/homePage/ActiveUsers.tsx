import { Container } from "@mui/material"
import { useEffect, useState } from "react"
import { getTopUsers, type PublicUser } from "../../api/catalog"

type UsersResult =
  | { status: "loading" | "error" }
  | { status: "ready"; users: PublicUser[] }

export default function ActiveUsers() {
  const [result, setResult] = useState<UsersResult>({ status: "loading" })
  const { status } = result

  useEffect(() => {
    if (status !== "loading") return

    const controller = new AbortController()
    getTopUsers(controller.signal).then(
      users => {
        if (!controller.signal.aborted)
          setResult({ status: "ready", users: users.slice(0, 4) })
      },
      () => {
        if (!controller.signal.aborted) setResult({ status: "error" })
      },
    )
    return () => controller.abort()
  }, [status])

  return (
    <section className="home-users" aria-labelledby="users-title">
      <Container className="home-container">
        <h2 id="users-title" className="home-section-title">
          Active Users
        </h2>
        {result.status === "loading" && (
          <output className="home-card-state">Loading active users…</output>
        )}
        {result.status === "error" && (
          <div className="home-card-state">
            <p role="alert">Active users could not be loaded.</p>
            <button
              type="button"
              onClick={() => setResult({ status: "loading" })}
              aria-label="Try again loading active users"
            >
              Try again
            </button>
          </div>
        )}
        {result.status === "ready" &&
          (result.users.length ? (
            <div className="users-grid">
              {result.users.map(user => (
                <figure className="user-card" key={user.id}>
                  <img src={user.image} alt="" loading="lazy" />
                  <figcaption>{user.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <output className="home-card-state">
              No active users to show.
            </output>
          ))}
      </Container>
    </section>
  )
}
