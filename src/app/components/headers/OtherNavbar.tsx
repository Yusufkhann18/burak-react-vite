import { Box, Container, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Basket } from "./Basket";
import { NavbarAccount } from "./NavbarAccount";

export function OtherNavbar() {
  const { member } = useAuth();
  return (
    <div className="other-navbar">
      <Container className="navbar-container">
        <Stack className="navbar-header">
          <Box>
            <NavLink to="/">
              <img className="navbar-logo" src="/icons/burak.svg" alt="Burak" />
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

            {member && (
              <>
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
              </>
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
      </Container>
    </div>
  );
}
