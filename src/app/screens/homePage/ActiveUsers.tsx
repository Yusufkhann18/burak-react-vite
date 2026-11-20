import { Container } from "@mui/material";
const users = [
  { name: "Justin", image: "martin" },
  { name: "Justin", image: "justin" },
  { name: "Rose", image: "rose" },
  { name: "Nusret", image: "nusret" },
];
export default function ActiveUsers() {
  return (
    <section className="home-users" aria-labelledby="users-title">
      <Container className="home-container">
        <h2 id="users-title" className="home-section-title">
          Active User
        </h2>
        <div className="users-grid">
          {users.map((user) => (
            <figure className="user-card" key={user.image}>
              <img src={`/img/home/${user.image}.webp`} alt={user.name} loading="lazy" />
              <figcaption>{user.name}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
