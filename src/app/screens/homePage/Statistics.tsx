import { Container } from "@mui/material";
const statistics = [
  ["12", "Restaurants"],
  ["8", "Experience"],
  ["50+", "Menu"],
  ["200+", "Clients"],
];
export default function Statistics() {
  return (
    <section className="home-statistics" aria-label="Burak in numbers">
      <Container className="home-container">
        <dl className="statistics-grid">
          {statistics.map(([value, label]) => (
            <div className="statistic" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
