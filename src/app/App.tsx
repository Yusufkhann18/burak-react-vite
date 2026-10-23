// import { Box, Button, Container, Stack, Typography } from "@mui/material";
import "../css/app.css";
// import { RippleBadge } from "./material/MaterialTheme/styled";
import { Route, Switch, useLocation } from "react-router-dom";
import { HomePage } from "./screens/homePage";

import { ProductsPage } from "./screens/productsPage";
import { OrdersPage } from "./screens/ordersPage";
import { UserPage } from "./screens/userPage";
import { HelpPage } from "./screens/helpPage";
import { Footer } from "./components/footer";
import { HomeNavbar } from "./components/headers/HomeNavbar";
import { OtherNavbar } from "./components/headers/OtherNavbar";

function App() {
  const location = useLocation();
  return (
    <>
      {location.pathname === "/" ? <HomeNavbar /> : <OtherNavbar />}

      <Switch>
        <Route exact path="/products">
          <ProductsPage />
        </Route>
        <Route exact path="/orders">
          <OrdersPage />
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
    </>
  );
}

export default App;
