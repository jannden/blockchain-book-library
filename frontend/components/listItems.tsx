import * as React from "react";
import Link from "next/link";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import HowToVote from "@mui/icons-material/HowToVote";
import MenuBook from "@mui/icons-material/MenuBook";

export const mainListItems = (
  <React.Fragment>
    <Link href="/marketplace">
      <ListItemButton>
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary="NFT Marketplace" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);

export const secondaryListItems = (
  <React.Fragment>
    <Link href="/book-library">
      <ListItemButton>
        <ListItemIcon>
          <MenuBook />
        </ListItemIcon>
        <ListItemText primary="Book Library" />
      </ListItemButton>
    </Link>
    <Link href="/election">
      <ListItemButton>
        <ListItemIcon>
          <HowToVote />
        </ListItemIcon>
        <ListItemText primary="Election" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);
