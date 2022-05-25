import { useWeb3React } from "@web3-react/core";

import Header from "../components/Header";
import Main from "../components/Main";
import Welcome from "../components/Welcome";

import Head from "next/head";
import Link from "next/link";
import Account from "../components/Account";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import { ELECTION_ADDRESS, BOOK_LIBRARY_ADDRESS } from "../utils/util";
import useEagerConnect from "../hooks/useEagerConnect";

function Home() {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <Header />
      <Main>
        <Welcome />
      </Main>
    </div>
  );
}

export default Home;
