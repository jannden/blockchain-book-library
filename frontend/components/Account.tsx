import { useWeb3React } from "@web3-react/core";
import LoggedIn from "./LoggedIn";
import LoggedOut from "./LoggedOut";

type AccountProps = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: AccountProps) => {
  const { error, account } = useWeb3React();

  if (error) {
    return null;
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    return <LoggedOut />;
  }

  return <LoggedIn />;
};

export default Account;
