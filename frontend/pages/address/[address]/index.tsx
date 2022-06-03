import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import MediaCard from "../../../components/MediaCard";
import { shortenHex } from "../../../utils/util";

const AddressTokens = ({ owner, marketplaceData }) => {
  return (
    <>
      <h3>Tokens owned by {shortenHex(owner)}</h3>

      {marketplaceData.userItems &&
        Object.keys(marketplaceData.userItems).map((key, index) => (
          <Box key={index}>
            <h3>Collection: {key}</h3>
            <Grid container spacing={3}>
              {marketplaceData.userItems[key].map((token, index2) => (
                <Grid item lg={3} key={index2}>
                  <MediaCard tokenData={token}></MediaCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
    </>
  );
};

export default AddressTokens;

export const getServerSideProps = async (context) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER}/api/nftsOfAddress/${context.params.address}`
  );
  const marketplaceData = await res.json();
  return {
    props: {
      owner: context.params.address,
      marketplaceData,
    },
  };
};
