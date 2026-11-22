import { Container } from "@mui/material"
import { Link } from "react-router-dom"
import { usePageState } from "../../components/pages/PageState"

export default function PopularDishes() {
  const { products, catalogStatus, retryCatalog } = usePageState()
  const dishes = products
    .filter(dish => dish.category === "DISH")
    .sort((left, right) => right.views - left.views)
    .slice(0, 4)

  return (
    <section className="home-popular" aria-labelledby="popular-title">
      <Container className="home-container">
        <h2 id="popular-title" className="home-section-title">
          Popular Dishes
        </h2>
        {catalogStatus === "loading" && (
          <output className="home-card-state">Loading popular dishes…</output>
        )}
        {catalogStatus === "error" && (
          <div className="home-card-state">
            <p role="alert">Popular dishes could not be loaded.</p>
            <button
              type="button"
              onClick={retryCatalog}
              aria-label="Try again loading popular dishes"
            >
              Try again
            </button>
          </div>
        )}
        {catalogStatus === "ready" && dishes.length === 0 && (
          <output className="home-card-state">
            No popular dishes to show.
          </output>
        )}
        <div className="popular-grid">
          {dishes.map(dish => (
            <Link to="/products" className="popular-card" key={dish.id}>
              <img
                className="popular-photo"
                src={dish.image}
                alt={dish.name}
                loading="lazy"
              />
              <div className="popular-subject">
                <h3>{dish.name}</h3>
                <span
                  className="dish-views"
                  aria-label={`${dish.views} ${dish.views === 1 ? "view" : "views"}`}
                >
                  {dish.views} <span className="eye-icon" aria-hidden="true" />
                </span>
              </div>
              <p className="popular-description">
                <img src="/icons/post.svg" alt="" />
                <span>{dish.description || dish.category}</span>
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
