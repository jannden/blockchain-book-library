import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import getLibrary from "../utils/getLibrary";
import "../styles/globals.css";
import Header from "../components/Header";
import Main from "../components/Main";

function NextWeb3App({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Header />
      <Main>
        <Component {...pageProps} />
      </Main>
    </Web3ReactProvider>
  );
}

export default NextWeb3App;
