import Head from "next/head";
import Link from "next/link";
import Account from "./Account";
import useEagerConnect from "../hooks/useEagerConnect";

function Home() {

  const triedToEagerConnect = useEagerConnect();

  return (
    <div>
      <Head>
        <title>LimeAcademy-boilerplate</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <Account triedToEagerConnect={triedToEagerConnect} />
      </header>


    </div>
  );
}

export default Home;
