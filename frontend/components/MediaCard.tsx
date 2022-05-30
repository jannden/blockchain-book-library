import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { grey } from "@mui/material/colors";
import { shortenHex } from "../utils/util";

type TokenData = {
  nftAddress: string;
  tokenId: string;
  tokenUri: string;
  price?: string;
  owner?: string;
};

type MediaCardProps = {
  tokenData: TokenData;
  handlePurchase?: (nftAddress: string, tokenId: string, price: string) => Promise<void>;
};

export default function MediaCard({ tokenData, handlePurchase }: MediaCardProps) {
  return (
    <Card sx={{ maxWidth: 345, backgroundColor: grey[50] }}>
      <CardMedia component="img" height="140" image={tokenData.tokenUri} />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {tokenData.price && `Ξ${tokenData.price}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Token ID: {tokenData.tokenId}
          <br />
          {tokenData.owner && `Owner: ${shortenHex(tokenData.owner, 4)}`}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "center" }}>
        {handlePurchase && (
          <Button
            size="small"
            onClick={handlePurchase.bind(
              this,
              tokenData.nftAddress,
              tokenData.tokenId,
              tokenData.price
            )}
          >
            Buy
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
