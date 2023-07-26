import EssentialVoting from '../../public/EssentialVoting.json';
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { Election } from './types';
import { getElectionById } from './firebase-config';

export const CONTRACT_ABI = EssentialVoting.abi;
export const CONTRACT_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
export const NODE_RPC_URL = 'http://localhost:8545';

export const PROVIDER = new JsonRpcProvider("http://localhost:8545");
function claimMyWallet(privateKey: string) {
    return new Wallet(privateKey);
}

function getContract(wallet: Wallet) {
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

export async function getElectionDetails(contract: Contract, id: string): Promise<Election | null> {
    const data = await getElectionById(id);
    if (!data) return null;
    const { electionIndex, totalVoters } = data;
    const election = await contract.getElectionByIndex(electionIndex);

    return {
      id: id,
      electionIndex: electionIndex,
      title: election.title,
      startTime: parseInt(election.startTime),
      endTime: parseInt(election.endTime),
      candidates: election.candidates.map((candidate: string) => candidate),
      totalVoters: totalVoters
    }
}
