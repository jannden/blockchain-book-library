import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { doAccountsMatch } from "../utils/util";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import Box from "@mui/material/Box";
import MediaCard from "../components/MediaCard";
import { grey } from "@mui/material/colors";

const ListedItems = (props: any) => {
  const { transactionInProgress, handlePurchase, graphData } = props;
  const { account } = useWeb3React<Web3Provider>();

  return (
    <Grid container spacing={3}>
      <Grid item lg={12}>
        {graphData.collectionsList?.length > 0 &&
          graphData.collectionsList.map(
            ({ nftAddress, tokens, collectionName }) =>
              tokens.some(
                (tokenData) =>
                  tokenData.owner &&
                  !doAccountsMatch(tokenData.owner, account) &&
                  Number(tokenData.price) !== 0
              ) && (
                <Paper
                  key={shortenHex(nftAddress)}
                  sx={{ padding: 3, mb: 3, backgroundColor: grey[50] }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3>Collection: {collectionName}</h3>
                  </Box>
                  <Grid container spacing={3}>
                    {tokens.map(
                      (tokenData, index2) =>
                        tokenData.owner &&
                        !doAccountsMatch(tokenData.owner, account) &&
                        Number(tokenData.price) !== 0 && (
                          <Grid item lg={3} key={index2}>
                            <MediaCard
                              tokenData={tokenData}
                              transactionInProgress={transactionInProgress}
                              handlePurchase={handlePurchase}
                            ></MediaCard>
                          </Grid>
                        )
                    )}
                  </Grid>
                </Paper>
              )
          )}
      </Grid>
    </Grid>
  );
};

export default ListedItems;
