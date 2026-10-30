import { Box, Button, Container, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";

export function HomeNavbar() {
  const authMember = true;

  return (
    <div className="home-navbar">
      <Container className="navbar-container">
        <Stack className="navbar-header">
          <Box>
            <NavLink to="/">
              <img className="navbar-logo" src="/icons/burak.svg" />
            </NavLink>
          </Box>

          <Stack className="navbar-links">
            <Box className="hover-line">
              <NavLink to="/" activeClassName="underline">
                Home
              </NavLink>
            </Box>

            <Box className="hover-line">
              <NavLink to="/products" activeClassName="underline">
                Products
              </NavLink>
            </Box>

            {authMember ? (
              <Box className="hover-line">
                <NavLink to="/orders" activeClassName="underline">
                  Orders
                </NavLink>
              </Box>
            ) : null}

            {authMember ? (
              <Box className="hover-line">
                <NavLink to="/member-page" activeClassName="underline">
                  My Page
                </NavLink>
              </Box>
            ) : null}

            <Box className="hover-line">
              <NavLink to="/help" activeClassName="underline">
                Help
              </NavLink>
            </Box>

            <NavLink
              to="/orders"
              className="navbar-basket"
              aria-label="Shopping basket"
            >
              <img src="/icons/shopping-cart.svg" alt="" />
            </NavLink>
            {!authMember ? (
              <Box>
                <Button variant="contained" className="navbar-login">
                  Login
                </Button>
              </Box>
            ) : (
              <img
                className="navbar-avatar"
                src="/img/pages/profile.webp"
                alt="Profil rasmi"
              />
            )}
          </Stack>
        </Stack>
        <Stack className="header-frame">
          <Stack className="detail">
            <Box className="head-main-txt">World's Most Delicious Cousine</Box>
            <Box className="well-txt">The Choice, not just a choice</Box>
            <Box className="service-txt">24 hours service</Box>
            <Box className="signup">
              {!authMember ? (
                <Button variant="contained" className="signup-btn">
                  Sign Up
                </Button>
              ) : null}
            </Box>
          </Stack>
          <Box className="logo-frame">
            <div className="logo-img"></div>
          </Box>
        </Stack>
      </Container>
    </div>
  );
}
