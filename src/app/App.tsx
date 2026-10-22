// import { Box, Button, Container, Stack, Typography } from "@mui/material";
import "../css/app.css";
// import { RippleBadge } from "./material/MaterialTheme/styled";
import { Link, Route, Switch } from "react-router-dom";
import { HomePage } from "./screens/homePage";

import { ProductsPage } from "./screens/productsPage";
import { OrdersPage } from "./screens/ordersPage";
import { UserPage } from "./screens/userPage";
import { HelpPage } from "./screens/helpPage";

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">HomePage</Link>
          </li>
          <li>
            <Link to="/products">ProductsPage</Link>
          </li>
          <li>
            <Link to="/orders">OrdersPage</Link>
          </li>
          <li>
            <Link to="/member-page">User Page</Link>
          </li>
          <li>
            <Link to="/help">Help Page</Link>
          </li>
        </ul>
      </nav>

      {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
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
    </div>
  );
}

export default App;
