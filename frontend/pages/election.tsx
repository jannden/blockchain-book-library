import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useElectionContract from "../hooks/useElectionContract";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import electionFactory from "../contracts/Election.json";
import { deployedElection } from "../utils/deployedContracts";

export enum Leader {
  UNKNOWN,
  CANDIDATE1,
  CANDIDATE2,
}

type InfoType = {
  error?: string;
  info?: string;
  link?: string;
  hash?: string;
};

const Election = () => {
  const { chainId, library, account } = useWeb3React<Web3Provider>();

  const [dynamicContractAddress, setDynamicContractAddress] = useState<string>(
    deployedElection.address
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [currentLeader, setCurrentLeader] = useState<string>(Leader[0]);
  const [currentSeats, setCurrentSeats] = useState<number[]>([0, 0]);
  const [electionEnded, setElectionEnded] = useState<boolean | undefined>();
  const [name, setName] = useState<string | undefined>();
  const [info, setInfo] = useState<InfoType>({});
  const [votesCandidate2, setVotesCandidate2] = useState<number | undefined>();
  const [votesCandidate1, setVotesCandidate1] = useState<number | undefined>();
  const [stateSeats, setStateSeats] = useState<number | undefined>();

  const electionContract = useElectionContract(dynamicContractAddress);

  useEffect(() => {
    if (electionContract) {
      getCurrentLeader();
      getCurrentSeats();
      getElectionEnded();
    }
  }, [electionContract]);

  const getCurrentLeader = async () => {
    const currentLeader = await electionContract.currentLeader();
    setCurrentLeader(Leader[currentLeader]);
  };

  const getCurrentSeats = async () => {
    const currentSeats = await electionContract.currentSeats();
    setCurrentSeats(currentSeats);
  };

  const getElectionEnded = async () => {
    const electionEnded = await electionContract.electionEnded();
    setElectionEnded(electionEnded);
  };

  const endElectionHandler = async () => {
    setLoading(true);
    try {
      const tx = await electionContract.endElection();
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      getElectionEnded();
    } catch (error) {
      setInfo({ error: error.error?.message || error.errorArgs?.[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };

  const stateInput = (input) => {
    setName(input.target.value);
  };

  const bideVotesInput = (input) => {
    setVotesCandidate2(input.target.value);
  };

  const candidate1VotesInput = (input) => {
    setVotesCandidate1(input.target.value);
  };

  const seatsInput = (input) => {
    setStateSeats(input.target.value);
  };

  const submitStateResults = async () => {
    const result: any = [name, votesCandidate2, votesCandidate1, stateSeats];
    setLoading(true);
    try {
      const tx = await electionContract.submitStateResult(result);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      resetForm();
      getCurrentLeader();
      getCurrentSeats();
    } catch (error) {
      setInfo({ error: error.error?.message || error.errorArgs?.[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };

  const newElectionHandler = async () => {
    const signer = library.getSigner(account);
    const Factory = new ethers.ContractFactory(
      electionFactory.abi,
      electionFactory.bytecode,
      signer
    );

    const contract = await Factory.deploy();
    await contract.deployed();
    console.log(contract);
    setDynamicContractAddress(contract.address);
    console.log(`Deployment successful! Contract Address: ${contract.address}`);
  };

  const resetForm = () => {
    setName("");
    setVotesCandidate2(0);
    setVotesCandidate1(0);
    setStateSeats(0);
  };

  return (
    <>
      <h1>Election</h1>
      <div className="results-form">
        {info.info && <div className="info">{info.info}</div>}
        {info.link && info.hash && (
          <div>
            <a href={info.link}>{info.hash}</a>
          </div>
        )}
        {info.error && <div className="error">{info.error}</div>}
        <p>
          Leader is <strong>{currentLeader}</strong>, election is{" "}
          {electionEnded ? "ended" : "running"}
          <br />
          {Leader[Leader.CANDIDATE1]} seats: {currentSeats[0]}
          <br />
          {Leader[Leader.CANDIDATE2]} seats: {currentSeats[1]}
        </p>
        {electionEnded ? (
          <>
            <div className="button-wrapper">
              <button disabled={loading} onClick={newElectionHandler}>
                Run a new election (redeploy)
              </button>
            </div>
            <p>
              When you want to save the address of a redeployed contract (so that it persists after
              page refresh), do so in ./utils/deployedContracts.ts
            </p>
          </>
        ) : (
          <>
            <div className="button-wrapper">
              <button disabled={loading} onClick={endElectionHandler}>
                End election
              </button>
            </div>
            <h4>Submit new results</h4>
            <form>
              <label>
                State:
                <input
                  disabled={loading}
                  onChange={stateInput}
                  value={name}
                  type="text"
                  name="state"
                />
              </label>
              <br />
              <label>
                {Leader[Leader.CANDIDATE1]} Votes:
                <input
                  disabled={loading}
                  onChange={bideVotesInput}
                  value={votesCandidate2}
                  type="number"
                  name="candidate2_votes"
                />
              </label>
              <br />
              <label>
                {Leader[Leader.CANDIDATE2]} Votes:
                <input
                  disabled={loading}
                  onChange={candidate1VotesInput}
                  value={votesCandidate1}
                  type="number"
                  name="candidate1_votes"
                />
              </label>
              <br />
              <label>
                Seats:
                <input
                  disabled={loading}
                  onChange={seatsInput}
                  value={stateSeats}
                  type="number"
                  name="seats"
                />
              </label>
            </form>
            <div className="button-wrapper">
              <button disabled={loading} onClick={submitStateResults}>
                {loading ? "Loading" : "Submit results"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Election;
