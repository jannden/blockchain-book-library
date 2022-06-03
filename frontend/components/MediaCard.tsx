import React, { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { grey } from "@mui/material/colors";
import { parseBalance, shortenHex } from "../utils/util";

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
  transactionInProgress?: boolean;
};

type TokenMetadata = {
  tokenName: string;
  tokenImage: string;
};

export default function MediaCard({
  tokenData,
  handlePurchase,
  transactionInProgress,
}: MediaCardProps) {
  const [loading, setLoading] = useState<Boolean>(true);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(tokenData.tokenUri);
        const metadata = await res.json();
        setTokenMetadata(metadata);
        setLoading(false);
      } catch (error) {
        console.error(`Not JSON: ${tokenData.tokenUri}`);
      }
    };
    fetchMetadata();
  }, [tokenData.tokenUri]);

  if (loading) {
    return null;
  }

  return (
    <Card sx={{ maxWidth: 345, backgroundColor: grey[50] }}>
      <CardMedia component="img" height="140" image={tokenMetadata.tokenImage} />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {tokenData.price && `Ξ${parseBalance(tokenData.price ?? 0)}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tokenMetadata.tokenName}
          <br />
          {tokenData.owner && (
            <>
              Owner:{" "}
              <a href={`${process.env.NEXT_PUBLIC_SERVER}/address/${tokenData.owner}`}>
                ${shortenHex(tokenData.owner, 4)}
              </a>
            </>
          )}
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
            disabled={transactionInProgress}
          >
            Buy
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
