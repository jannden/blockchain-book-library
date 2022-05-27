import React from "react";
import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import getLibrary from "../utils/getLibrary";
import "../styles/globals.css";
import Main from "../components/Main";
import Layout from "../components/Layout";

function NextWeb3App({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Layout>
        <Main>
          <Component {...pageProps} />
        </Main>
      </Layout>
    </Web3ReactProvider>
  );
}

export default NextWeb3App;
