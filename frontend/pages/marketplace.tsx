import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import useBookLibraryContract from "../hooks/useBookLibraryContract";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import { createClient } from "urql";
import { deployedNftCollection } from "../utils/deployedContracts";

const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/0.0.4";
const graphQuery = `
      query {
      itemListeds {
        id
        seller
        nftAddress
        tokenId
        price
        timestamp
        owner
        nftUri
      }
      itemCanceleds {
        id
        seller
        nftAddress
        tokenId
        timestamp
        owner
        nftUri
      }
      itemBoughts {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        owner
        nftUri
      }
    }
  `;

type InfoType = {
  error?: string;
  info?: string;
  link?: string;
  hash?: string;
};

const Marketplace = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  async function fetchData() {
    const client = createClient({ url: graphUrl });
    const data = await client.query(graphQuery).toPromise();
    const { itemListeds, itemCanceleds, itemBoughts } = data.data;
    const mergedFilter = [...itemCanceleds, ...itemBoughts];
    const currentItems = itemListeds.filter((el: any) => {
      return !mergedFilter.some((f) => {
        return (
          f.nftAddress === el.nftAddress && f.tokenId === el.tokenId && f.timestamp > el.timestamp
        );
      });
    });
    console.log(currentItems);
  }
  useEffect(() => {
    console.log("Fetching");
    fetchData();
    console.log("Fetching");
  }, []);

  return (
    <>
      <h1>Marketplace</h1>
      <div>
        {info.info && <div className="info">{info.info}</div>}
        {info.link && info.hash && (
          <div>
            <a href={info.link}>{info.hash}</a>
          </div>
        )}
        {info.error && <div className="error">{info.error}</div>}
        <div>
          <h4>Create a collection</h4>
          <h4>Mint a new token</h4>
          <h4>Owned tokens grouped by collections (Minted + Bought)</h4>
          <h4>Add token to the marketplace</h4>
          <h4>Remove token from the marketplace</h4>
          <h4>Tokens for sale (with option to buy)</h4>
        </div>
      </div>
    </>
  );
};

export default Marketplace;
