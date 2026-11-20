import { Container } from "@mui/material";
import { Link } from "react-router-dom";
const dishes = [
  { name: "Cutlet", image: "cutlet" },
  { name: "Kebab", image: "kebab-grill" },
  { name: "Lavash", image: "lavash" },
  { name: "Kebab", image: "kebab" },
];
export default function NewDishes() {
  return (
    <section className="home-fresh" aria-labelledby="fresh-title">
      <Container className="home-container">
        <h2 id="fresh-title" className="home-section-title">
          Fresh Menu
        </h2>
        <div className="fresh-grid">
          {dishes.map((dish) => (
            <Link to="/products" className="fresh-card" key={dish.image}>
              <img
                className="fresh-photo"
                src={`/img/home/${dish.image}.webp`}
                alt={dish.name}
                loading="lazy"
              />
              <span className="dish-size">NORMAL size</span>
              <div className="fresh-detail">
                <h3>{dish.name}</h3>
                <span className="dish-price">$7</span>
                <span className="dish-views" aria-label="1 view">
                  1 <span className="eye-icon" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
