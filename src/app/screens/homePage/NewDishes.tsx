import { Container } from "@mui/material"
import { Link } from "react-router-dom"
import { usePageState } from "../../components/pages/PageState"

export default function NewDishes() {
  const { products, catalogStatus, retryCatalog } = usePageState()
  const dishes = products
    .slice()
    .sort(
      (left, right) =>
        (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0),
    )
    .slice(0, 4)

  return (
    <section className="home-fresh" aria-labelledby="fresh-title">
      <Container className="home-container">
        <h2 id="fresh-title" className="home-section-title">
          Fresh Menu
        </h2>
        {catalogStatus === "loading" && (
          <output className="home-card-state">Loading the fresh menu…</output>
        )}
        {catalogStatus === "error" && (
          <div className="home-card-state">
            <p role="alert">The fresh menu could not be loaded.</p>
            <button
              type="button"
              onClick={retryCatalog}
              aria-label="Try again loading the fresh menu"
            >
              Try again
            </button>
          </div>
        )}
        {catalogStatus === "ready" && dishes.length === 0 && (
          <output className="home-card-state">No fresh dishes to show.</output>
        )}
        <div className="fresh-grid">
          {dishes.map(dish => {
            const size =
              dish.category === "DRINK"
                ? dish.volume
                  ? `${dish.volume} L`
                  : ""
                : dish.size
                  ? `${dish.size} size`
                  : ""
            return (
              <Link to="/products" className="fresh-card" key={dish.id}>
                <img
                  className="fresh-photo"
                  src={dish.image}
                  alt={dish.name}
                  loading="lazy"
                />
                {size && <span className="dish-size">{size}</span>}
                <div className="fresh-detail">
                  <h3>{dish.name}</h3>
                  <span className="dish-price">${dish.price}</span>
                  <span
                    className="dish-views"
                    aria-label={`${dish.views} ${dish.views === 1 ? "view" : "views"}`}
                  >
                    {dish.views}{" "}
                    <span className="eye-icon" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
