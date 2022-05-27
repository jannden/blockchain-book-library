import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useEffect, useState, useRef } from "react";
import nftCollectionFactory from "../contracts/NftCollection.json";
import { createClient } from "urql";
import { deployedNftMarketplace, deployedNftCollection } from "../utils/deployedContracts";
import useNftMarketplaceContract from "../hooks/useNftMarketplaceContract";
import useNftCollectionContract from "../hooks/useNftCollectionContract";
import { create as createIpsf, CID, IPFSHTTPClient } from "ipfs-http-client";

const ipfs: IPFSHTTPClient = createIpsf({
  url: "https://ipfs.infura.io:5001",
});

const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v0.5";
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

type Inputs = {
  nftName: string | undefined;
  nftSymbol: string | undefined;
  nftAddress: string | undefined;
};

const defaultInputs: Inputs = {
  nftName: undefined,
  nftSymbol: undefined,
  nftAddress: undefined,
};

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const nftCollectionContract = useNftCollectionContract(deployedNftCollection.address);
  const { library, account } = useWeb3React<Web3Provider>();

  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const nftImage = useRef(null);

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

  const inputHandler = (e) => {
    e.preventDefault();
    switch (e.target.name) {
      case "nftName":
        setInputs((inputs) => ({ ...inputs, nftName: e.target.value }));
      case "nftSymbol":
        setInputs((inputs) => ({ ...inputs, nftSymbol: e.target.value }));
      case "nftAddress":
        setInputs((inputs) => ({ ...inputs, nftAddress: e.target.value }));
    }
  };

  const deployCollection = async () => {
    if (!inputs.nftName || !inputs.nftSymbol) {
      return alert("Fill out the fields.");
    }

    // Preparing the contract factory
    const signer = library.getSigner(account);
    const factory = new ethers.ContractFactory(
      nftCollectionFactory.abi,
      nftCollectionFactory.bytecode,
      signer
    );

    // Deploying a new NFT collection contract
    const contract = await factory.deploy(
      inputs.nftName,
      inputs.nftSymbol,
      deployedNftMarketplace.address
    );
    await contract.deployed();

    // Storing the info in the Marketplace contract
    const addCollection = await nftMarketplaceContract.addCollection(contract.address);
    await addCollection.wait();

    console.log("Done");
  };

  const mintNft = async () => {
    const image = nftImage.current?.files?.[0];

    if (!image || !inputs.nftAddress) {
      return alert("Fill out the fields.");
    }

    try {
      // Upload the image
      const uploadedImage = await ipfs.add(image);
      const imagePath = `https://ipfs.infura.io/ipfs/${uploadedImage.path}`;

      // Connect to the NFT contract
      const signer = library.getSigner(account);
      const Factory = new ethers.ContractFactory(
        nftCollectionFactory.abi,
        nftCollectionFactory.bytecode,
        signer
      );

      // Mint
      const contract = Factory.attach(inputs.nftAddress);
      const safeMint = await contract.safeMint(account, imagePath);
      const result = await safeMint.wait();

      console.log(result);
    } catch (error) {
      console.log(error);
    }
  };
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
          <h4>Create a nft</h4>
          <label>
            NFT Name
            <input type="text" name="nftName" onChange={inputHandler} value={inputs.nftName} />
          </label>
          <label>
            NFT Symbol
            <input type="text" name="nftSymbol" onChange={inputHandler} value={inputs.nftSymbol} />
          </label>
          <button onClick={deployCollection}>Deploy Collection</button>
          <h4>Mint a new token</h4>
          <label>
            NFT Image
            <input type="file" ref={nftImage} />
          </label>
          <label>
            NFT Address
            <input
              type="text"
              name="nftAddress"
              onChange={inputHandler}
              value={inputs.nftAddress}
            />
          </label>
          <button type="button" onClick={mintNft}>
            Mint NFT
          </button>
          {!ipfs && <p>Oh oh, Not connected to IPFS. Checkout out the logs for errors</p>}
          <h4>Owned tokens grouped by NFT collections (Minted + Bought / Listed + Not Listed)</h4>
          <p>
            Not listed minted tokens can be accessed by iterating over all user collections calling
            balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
            have ever been listed on the marketplace can be omitted, as they will be fetched from
            the marketplace events.
          </p>
          <h4>Add token to the marketplace</h4>
          <h4>Remove token from the marketplace</h4>
          <h4>Tokens for sale (with option to buy)</h4>
        </div>
      </div>
    </>
  );
};

export default Marketplace;
