import { Link } from "react-router-dom";
import "../../../css/footer.css";

const socialIcons = [
  { name: "Facebook", icon: "/icons/facebook.svg" },
  { name: "Twitter", icon: "/icons/twitter.svg" },
  { name: "Instagram", icon: "/icons/instagram.svg" },
  { name: "YouTube", icon: "/icons/youtube.svg" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-columns">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link" aria-label="Burak home">
              <img className="footer-logo" src="/icons/burak.svg" alt="Burak" />
            </Link>
            <p className="footer-description">
              Focusing on the gourmet Turkish breakfast as well as the youth
              society, CZN Burak Gurme aims to bring Turkish cuisine back. CZN
              Burak Gurme creates an illusion with its cuisine.
            </p>
            <ul className="footer-socials" aria-label="Social media">
              {socialIcons.map(({ name, icon }) => (
                <li key={name}>
                  <img src={icon} alt={name} width="18" height="18" />
                </li>
              ))}
            </ul>
          </div>

          <nav className="footer-navigation" aria-label="Footer navigation">
            <h2 className="footer-heading">Fields</h2>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/help">Help</Link></li>
            </ul>
          </nav>

          <section className="footer-contact" aria-labelledby="footer-contact-title">
            <h2 className="footer-heading" id="footer-contact-title">Contact us</h2>
            <address className="footer-address">
              <dl className="footer-contact-list">
                <div>
                  <dt><abbr title="Location">L.</abbr></dt>
                  <dd>Downtown, Dubai</dd>
                </div>
                <div>
                  <dt><abbr title="Phone">P.</abbr></dt>
                  <dd><a href="tel:+97145547777">+971 4 554 7777</a></dd>
                </div>
                <div>
                  <dt><abbr title="Email">E.</abbr></dt>
                  <dd><a href="mailto:devexuz@gmail.com">devexuz@gmail.com</a></dd>
                </div>
                <div>
                  <dt><abbr title="Hours">H.</abbr></dt>
                  <dd>Visit 24 hours</dd>
                </div>
              </dl>
            </address>
          </section>
        </div>

        <div className="footer-bottom">
          <p>© Copyright Devex Global, All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
