import { useState, type FormEvent } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "../../../css/help.css";
const faqs = [
  ["How to make order?", "You should choose products and make an order via basket!"],
  [
    "How long does delivery takes?",
    "Delivery time depends on your address and order. Contact the restaurant for the current delivery estimate.",
  ],
  [
    "Is our details secure in this platform?",
    "This preview stores profile information only in your browser. Online accounts and payments are not connected yet.",
  ],
  [
    "I am blocked, what should I do?",
    "Contact the restaurant using the Contact section so the team can help with your account.",
  ],
];
const terms = [
  "Making orders from the site is complete, live register to use communications you must pass.",
  "This is why you cannot cancel your orders once you have paid for them check before making payments.",
  "It is not possible to write and distribute personal ads without the permission of the admin.",
  "All your actions are under the control of our restaurant administration, so please follow the general rules.",
];
export function HelpPage() {
  const location = useLocation();
  const history = useHistory();
  const value = new URLSearchParams(location.search).get("tab");
  const tab = value === "contact" || value === "terms" ? value : "faq";
  const [open, setOpen] = useState<number | null>(0);
  const [message, setMessage] = useState("");
  function contact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Your message has not been sent: the contact service is not connected yet. Please email devexuz@gmail.com or call +971 4 554 7777.",
    );
  }
  return (
    <main className="inner-page help-page">
      <div className="page-container">
        <div className="help-tabs" role="tablist" aria-label="Help sections">
          {["terms", "faq", "contact"].map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === item}
              aria-controls="help-content"
              id={`help-tab-${item}`}
              key={item}
              onClick={() => history.replace(`/help?tab=${item}`)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <section
          className={`help-panel help-${tab}`}
          id="help-content"
          role="tabpanel"
          aria-labelledby={`help-tab-${tab}`}
        >
          {tab === "faq" && (
            <>
              <h1 className="sr-only">Frequently asked questions</h1>
              {faqs.map(([question, answer], index) => (
                <div className="faq-item" key={question}>
                  <h2>
                    <button
                      aria-expanded={open === index}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpen(open === index ? null : index)}
                    >
                      {question}
                      <span aria-hidden="true">{open === index ? "−" : "+"}</span>
                    </button>
                  </h2>
                  <div id={`faq-answer-${index}`} hidden={open !== index}>
                    <p>{answer}</p>
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "terms" && (
            <>
              <h1 className="sr-only">Terms</h1>
              <ul className="terms-list">
                {terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </>
          )}
          {tab === "contact" && (
            <form className="contact-form" onSubmit={contact}>
              <h1>Contact Us!</h1>
              <p>Fill out below form to send a message!</p>
              <label>
                Ism
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Ilkhom"
                  maxLength={100}
                />
              </label>
              <label>
                Elektron Manzil
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="email"
                  maxLength={200}
                />
              </label>
              <label>
                Xabar
                <textarea name="message" required rows={8} placeholder="Xabar" maxLength={4000} />
              </label>
              <div className="contact-submit">
                <p role="status">{message}</p>
                <button type="submit" className="page-button">
                  SEND
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
