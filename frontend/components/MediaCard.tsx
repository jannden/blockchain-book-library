import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { grey } from "@mui/material/colors";
import { Link as MUILink } from "@mui/material";
import { parseBalance, shortenHex } from "../utils/util";
import { DialogActionTypes } from "../utils/types";

type TokenData = {
  nftAddress: string;
  tokenId: string;
  tokenUri: string;
  price?: string;
  owner?: string;
  currentlyListed?: boolean;
};

type MediaCardProps = {
  tokenData: TokenData;
  handlePurchase?: (nftAddress: string, tokenId: string, price: string) => Promise<void>;
  handleActiveToken?: (action: DialogActionTypes, nftAddress: string, tokenId: string) => void;
  transactionInProgress?: boolean;
};

type TokenMetadata = {
  tokenName: string;
  tokenImage: string;
};

export default function MediaCard({
  tokenData,
  handlePurchase,
  handleActiveToken,
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
              <NextLink
                href={`${process.env.NEXT_PUBLIC_SERVER}/address/${tokenData.owner}`}
                passHref
              >
                <MUILink variant="body2">{shortenHex(tokenData.owner)}</MUILink>
              </NextLink>
            </>
          )}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "center" }}>
        {handlePurchase && (
          <Button
            variant="contained"
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

        {handleActiveToken && (
          <>
            {tokenData.currentlyListed ? (
              <Button
                variant="contained"
                onClick={handleActiveToken.bind(
                  this,
                  DialogActionTypes.CANCEL,
                  tokenData.nftAddress,
                  tokenData.tokenId
                )}
                disabled={transactionInProgress}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleActiveToken.bind(
                  this,
                  DialogActionTypes.LIST,
                  tokenData.nftAddress,
                  tokenData.tokenId
                )}
                disabled={transactionInProgress}
              >
                Sell
              </Button>
            )}
          </>
        )}
      </CardActions>
    </Card>
  );
}
