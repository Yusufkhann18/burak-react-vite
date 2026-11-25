import { lazy, Suspense } from "react";
import { PageStateProvider } from "./components/pages/PageState";
import { AuthProvider } from "./auth/AuthProvider";
import { Route, Switch, useLocation } from "react-router-dom";
import HomePage from "./screens/homePage";

import { ProductsPage, ProductDetailPage } from "./screens/productsPage";
import { UserPage } from "./screens/userPage";
import { HelpPage } from "./screens/helpPage";
import { Footer } from "./components/footer";
import { HomeNavbar } from "./components/headers/HomeNavbar";
import { OtherNavbar } from "./components/headers/OtherNavbar";
import "../css/app.css";
import "../css/navbar.css";
import "../css/home.css";
import "../css/pages.css";

const OrdersPage = lazy(() => import("./screens/ordersPage"));

function App() {
  const location = useLocation();
  return (
    <AuthProvider>
      <PageStateProvider>
        {location.pathname === "/" ? <HomeNavbar /> : <OtherNavbar />}

        <Switch>
          <Route exact path="/products/:productId">
            <ProductDetailPage />
          </Route>
          <Route exact path="/products">
            <ProductsPage />
          </Route>
          <Route exact path="/orders">
            <Suspense fallback={<main className="inner-page"><output>Loading orders…</output></main>}>
              <OrdersPage />
            </Suspense>
          </Route>
          <Route exact path="/member-page">
            <UserPage />
          </Route>
          <Route exact path="/help">
            <HelpPage />
          </Route>
          <Route exact path="/">
            <HomePage />
          </Route>
        </Switch>
        <Footer />
      </PageStateProvider>
    </AuthProvider>
  );
}

export default App;
