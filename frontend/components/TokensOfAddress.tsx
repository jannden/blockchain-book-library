import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import { grey } from "@mui/material/colors";
import MediaCard from "../components/MediaCard";
import { doAccountsMatch } from "../utils/util";

const TokensOfAddress = (props: any) => {
  const { address, transactionInProgress, handlePurchase, graphData } = props;

  if (!!address === false) {
    return <Alert severity="error">No address provided.</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item lg={12}>
        {graphData.collectionsList?.length > 0 &&
          graphData.collectionsList.map(
            ({ nftAddress, tokens, collectionName }) =>
              tokens.some(
                (tokenData) => tokenData.owner && doAccountsMatch(tokenData.owner, address)
              ) && (
                <Paper key={nftAddress} sx={{ padding: 3, mb: 3, backgroundColor: grey[50] }}>
                  <h3>Collection: {collectionName}</h3>
                  <Grid container spacing={3}>
                    {tokens.map(
                      (tokenData, index2) =>
                        tokenData.owner &&
                        doAccountsMatch(tokenData.owner, address) && (
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

export default TokensOfAddress;
