import { useWeb3React } from "@web3-react/core";
import useEagerConnect from "../hooks/useEagerConnect";

function Home({ children }) {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <main>{children}</main>

      <style jsx>{`
        main {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default Home;
