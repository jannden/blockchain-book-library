import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useRouter } from "next/router";
import TokensOfAddress from "../../../components/TokensOfAddress";
import Buyable from "../../../components/Buyable";
import AccountError from "../../../components/AccountError";
import { doAccountsMatch } from "../../../utils/util";

const AddressPage = () => {
  const router = useRouter();
  const { address } = router.query;

  const { account } = useWeb3React<Web3Provider>();

  if (account && typeof address === "string" && doAccountsMatch(account, address)) {
    router.push("/my-tokens");
  }

  if (!!account === false) {
    return <AccountError />;
  }

  return (
    <Buyable graphAccount={address} listedOnly={false}>
      <TokensOfAddress address={address} />
    </Buyable>
  );
};

export default AddressPage;
