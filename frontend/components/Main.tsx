import { useWeb3React } from "@web3-react/core";
import useEagerConnect from "../hooks/useEagerConnect";

function Home({children}) {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <main>
        <h1>
          Welcome to{" "}
          <a href="https://github.com/LimeChain/next-web3-boilerplate">
            LimeAcademy-boilerplate
          </a>
        </h1>
        {children}
      </main>

      <style jsx>{`
        main {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default Home;
