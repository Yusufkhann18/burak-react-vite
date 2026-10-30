import { usePageState } from "../pages/PageState";
import { Box, Button, Container, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";

export function OtherNavbar() {
  const authMember = null;
  const { basket } = usePageState();
  return (
    <div className="other-navbar">
      <Container className="navbar-container">
        <Stack className="navbar-header">
          <Box>
            <NavLink to="/">
              <img className="navbar-logo" src="/icons/burak.svg" />
            </NavLink>
          </Box>

          <Stack className="navbar-links">
            <Box className="hover-line">
              <NavLink exact to="/">
                Home
              </NavLink>
            </Box>

            <Box className="hover-line">
              <NavLink to="/products" activeClassName="underline">
                Products
              </NavLink>
            </Box>

            <Box className="hover-line">
              <NavLink to="/orders" activeClassName="underline">
                Orders
              </NavLink>
            </Box>

            <Box className="hover-line">
              <NavLink to="/member-page" activeClassName="underline">
                My Page
              </NavLink>
            </Box>

            <Box className="hover-line">
              <NavLink to="/help" activeClassName="underline">
                Help
              </NavLink>
            </Box>

            <NavLink to="/products?basket=1" className="navbar-basket" aria-label="Shopping basket">
              <img src="/icons/shopping-cart.svg" alt="" />
              {basket.length > 0 && (
                <span className="basket-count">
                  {basket.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </NavLink>
            {!authMember ? (
              <Box>
                <Button variant="contained" className="navbar-login">
                  Login
                </Button>
              </Box>
            ) : (
              <img className="navbar-avatar" src="/img/pages/profile.webp" alt="Profil rasmi" />
            )}
          </Stack>
        </Stack>
      </Container>
    </div>
  );
}
