import React from "react";
import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import Head from "next/head";
import getLibrary from "../utils/getLibrary";
import "../styles/globals.css";
import Layout from "../components/Layout";

function NextWeb3App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="viewport-fit=cover" />
      </Head>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Web3ReactProvider>
    </>
  );
}

export default NextWeb3App;
