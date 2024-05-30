import * as React from "react";
import Link from "next/link";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { AccountBox } from "@mui/icons-material";

export const mainListItems = (
  <React.Fragment>
    <Link href="/" passHref>
      <ListItemButton>
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary="Marketplace" />
      </ListItemButton>
    </Link>
    <Link href="/my-tokens" passHref>
      <ListItemButton>
        <ListItemIcon>
          <AccountBox />
        </ListItemIcon>
        <ListItemText primary="My tokens" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);
