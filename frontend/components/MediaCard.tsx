import React, { useState, useEffect } from "react";
import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import NextLink from "next/link";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import { Link as MUILink } from "@mui/material";
import { doAccountsMatch, parseBalance, shortenHex } from "../utils/util";
import { DialogActionTypes, TokenMetadata, MediaCardProps } from "../utils/types";

export default function MediaCard({
  tokenData,
  handlePurchase,
  handleDialogOpening,
  transactionInProgress,
}: MediaCardProps) {
  const { account } = useWeb3React<Web3Provider>();
  const [loading, setLoading] = useState<Boolean>(true);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>();

  useEffect(() => {
    let isSubscribed = true;
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const res = await fetch(tokenData.tokenUri);
        const metadata = await res.json();
        if (isSubscribed) {
          setTokenMetadata(metadata);
        }
        setLoading(false);
      } catch (error) {
        console.error(`Not JSON: ${tokenData.tokenUri}`);
      }
    };
    fetchMetadata();
    return () => {
      isSubscribed = false;
    };
  }, [tokenData.tokenUri]);

  if (loading) {
    return null;
  }
  return (
    <Card sx={{ maxWidth: 345, backgroundColor: "white" }}>
      <CardMedia component="img" height="140" image={tokenMetadata.tokenImage} />
      <CardContent>
        <Typography variant="body2" color="text.secondary" align="center" component="div">
          <Typography gutterBottom variant="subtitle1" component="div">
            {tokenMetadata.tokenName}
          </Typography>
          {!doAccountsMatch(tokenData.owner, account) && (
            <>
              Owned by{" "}
              <NextLink
                href={`${process.env.NEXT_PUBLIC_SERVER}/address/${tokenData.owner}`}
                passHref
              >
                <MUILink variant="body2">{shortenHex(tokenData.owner)}</MUILink>
              </NextLink>
            </>
          )}
          <br />
        </Typography>
      </CardContent>
      <CardActions
        sx={{ justifyContent: Number(tokenData.price) === 0 ? "center" : "space-between" }}
      >
        <Typography gutterBottom variant="body1" component="div">
          {Number(tokenData.price) !== 0 && `Ξ${parseBalance(tokenData.price ?? 0)}`}
        </Typography>

        {handlePurchase && Number(tokenData.price) !== 0 && (
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

        {handleDialogOpening && (
          <>
            {tokenData.type === "listed" ? (
              <Button
                variant="outlined"
                onClick={handleDialogOpening.bind(
                  this,
                  DialogActionTypes.CANCEL_LISTING,
                  tokenData.nftAddress,
                  tokenData.tokenId
                )}
                disabled={transactionInProgress}
              >
                Stop selling
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleDialogOpening.bind(
                  this,
                  DialogActionTypes.LIST_ITEM,
                  tokenData.nftAddress,
                  tokenData.tokenId
                )}
                disabled={transactionInProgress}
              >
                Start selling
              </Button>
            )}
          </>
        )}
      </CardActions>
    </Card>
  );
}
