import { Box, Button, Container, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Basket } from "./Basket";
import { NavbarAccount } from "./NavbarAccount";

export function HomeNavbar() {
  const { member, openSignup, status } = useAuth();

  return (
    <div className="home-navbar">
      <Container className="navbar-container">
        <Stack className="navbar-header">
          <Box>
            <NavLink to="/">
              <img className="navbar-logo" src="/icons/burak.svg" alt="Burak" />
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

            {member && (
              <Box className="hover-line">
                <NavLink to="/orders" activeClassName="underline">
                  Orders
                </NavLink>
              </Box>
            )}

            {member && (
              <Box className="hover-line">
                <NavLink to="/member-page" activeClassName="underline">
                  My Page
                </NavLink>
              </Box>
            )}

            <Box className="hover-line">
              <NavLink to="/help" activeClassName="underline">
                Help
              </NavLink>
            </Box>

            <Basket />
            <NavbarAccount />
          </Stack>
        </Stack>
        <Stack className="header-frame">
          <Stack className="detail">
            <Box className="head-main-txt">World's Most Delicious Cousine</Box>
            <Box className="well-txt">The Choice, not just a choice</Box>
            <Box className="service-txt">24 hours service</Box>
            <Box className="signup">
              {!member && (
                <Button
                  variant="contained"
                  className="signup-btn"
                  disabled={status === "loading"}
                  onClick={openSignup}
                >
                  Sign Up
                </Button>
              )}
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
