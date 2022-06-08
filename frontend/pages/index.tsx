import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import AccountError from "../components/AccountError";
import Buyable from "../components/Buyable";
import ListedItems from "../components/ListedItems";

const Marketplace = () => {
  const { account } = useWeb3React<Web3Provider>();

  if (!!account === false) {
    return <AccountError />;
  }

  return (
    <Buyable graphAccount={account} listedOnly={true}>
      <ListedItems />
    </Buyable>
  );
};

export default Marketplace;
