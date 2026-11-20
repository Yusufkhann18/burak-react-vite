import { Container } from "@mui/material";
import { Link } from "react-router-dom";
const dishes = [
  { name: "Lavash", image: "lavash", description: "This is Turkish Lavash" },
  { name: "Cutlet", image: "cutlet", description: "This is Turkish Cutlet" },
  { name: "Kebab", image: "kebab-grill", description: "Kebab" },
  { name: "Kebab", image: "kebab", description: "This is Turkish Kebab" },
];
export default function PopularDishes() {
  return (
    <section className="home-popular" aria-labelledby="popular-title">
      <Container className="home-container">
        <h2 id="popular-title" className="home-section-title">
          Popular Dishes
        </h2>
        <div className="popular-grid">
          {dishes.map((dish) => (
            <Link to="/products" className="popular-card" key={dish.image}>
              <img
                className="popular-photo"
                src={`/img/home/${dish.image}.webp`}
                alt={dish.name}
                loading="lazy"
              />
              <div className="popular-subject">
                <h3>{dish.name}</h3>
                <span className="dish-views" aria-label="2 views">
                  2 <span className="eye-icon" aria-hidden="true" />
                </span>
              </div>
              <p className="popular-description">
                <img src="/icons/post.svg" alt="" />
                {dish.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
