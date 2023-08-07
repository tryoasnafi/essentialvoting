import EssentialVoting from '../../public/EssentialVoting.json';
import { BaseWallet, Contract, EventLog, JsonRpcProvider, Signer, Wallet } from "ethers";
import { Election } from './types';
import { getElectionById } from './firebase-config';

export const CONTRACT_ABI = EssentialVoting.abi;
export const CONTRACT_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
export const NODE_RPC_URL = process.env.NEXT_PUBLIC_NGROK_NODE_RPC_URL || 'http://localhost:8545';

export const PROVIDER = new JsonRpcProvider(NODE_RPC_URL);

export function newWallet(privateKey?: string): BaseWallet {
    if (privateKey) {
        return new Wallet(privateKey);
    }
    return Wallet.createRandom();
}

export function generateWallets(total: number) {
    // generate wallet for total
    let wallets = [];
    for (let i = 0; i < total; i++) {
        wallets.push(newWallet());
    }
    return wallets;
}

export function getContract(runner: Signer): Contract {
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, runner);
}

export async function getElectionDetails(contract: Contract, id: string): Promise<Election | null> {
    const data = await getElectionById(id);
    if (!data) return null;
    const { electionIndex, totalVoters } = data;
    const election = await contract.getElectionByIndex(electionIndex);
    console.log(election)
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


export interface CastVoteEventLog {
    contractAddress: string,
    from: string,
    electionIndex: number,
    candidateId: number,
    blockHash: string,
    blockNumber: number,
    transactionHash: string,
    extraData?: any[],
    timestamp: number
};

export async function getPastVoteEvents(contract: Contract, electionIndex: number): Promise<CastVoteEventLog[]> {
    const allVotesEvents = await contract.queryFilter(contract.filters.CastVote()) as EventLog[];
    const filteredEvents = allVotesEvents.filter((event) => parseInt(event.args.electionIndex) === electionIndex);
    console.log(filteredEvents)
    const events = filteredEvents.map((event) => {
        const { address, blockHash, blockNumber, transactionHash, args } = event;
        const { voter, electionIndex, candidateId, timestamp } = args;
        return {
            contractAddress: address,
            from: voter,
            electionIndex: parseInt(electionIndex),
            candidateId: parseInt(candidateId),
            blockHash,
            blockNumber,
            transactionHash,
            timestamp: parseInt(timestamp)
        }
    })

    return events;
}
