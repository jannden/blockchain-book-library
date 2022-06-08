import React from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { createClient, Provider as UrqlProvider } from "urql";
import type { AppProps } from "next/app";
import Head from "next/head";
import getLibrary from "../utils/getLibrary";
import "../styles/globals.css";
import Layout from "../components/Layout";
import { graphUrl } from "../utils/util";

const urqlClient = createClient({ url: graphUrl });

function NextWeb3App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="viewport-fit=cover" />
      </Head>
      <Web3ReactProvider getLibrary={getLibrary}>
        <UrqlProvider value={urqlClient}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </UrqlProvider>
      </Web3ReactProvider>
    </>
  );
}

export default NextWeb3App;
