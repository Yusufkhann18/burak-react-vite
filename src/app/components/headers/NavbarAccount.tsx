import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export function NavbarAccount() {
  const { member, status, error, openLogin, logout, isLoggingOut } = useAuth();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const menuId = useId();
  const isOpen = !!member && !!anchor && anchor.isConnected;

  if (!member) {
    return (
      <Button
        variant="contained"
        className="navbar-login"
        disabled={status === "loading"}
        onClick={() => {
          setAnchor(null);
          openLogin();
        }}
      >
        Login
      </Button>
    );
  }

  return (
    <>
      <IconButton
        className="navbar-account"
        aria-label={`Account for ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <img className="navbar-avatar" src={member.image} alt="" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={isOpen}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { id: menuId, "aria-label": "Account" } }}
      >
        <MenuItem component={Link} to="/member-page" onClick={() => setAnchor(null)}>
          My profile
        </MenuItem>
        <MenuItem disabled={isLoggingOut} onClick={() => void logout()}>
          {isLoggingOut ? "Logging out…" : "Log out"}
        </MenuItem>
        {error && <li className="navbar-account-error" role="alert">{error}</li>}
      </Menu>
    </>
  );
}
