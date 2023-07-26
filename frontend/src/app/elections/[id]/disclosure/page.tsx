'use client'

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTRACT_ABI, CONTRACT_ADDRESS, NODE_RPC_URL, getElectionDetails } from "@/lib/contract";
import { getElectionById } from "@/lib/firebase-config";
import { Election } from "@/lib/types";
import { Contract, Interface, JsonRpcProvider } from "ethers";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface electionHistories {
  timestamp: number,
  electionId: string,
  parentHash: string,
  transactionHash: string,
  transactionData: string
}

async function getPastVoteEvents(contract: Contract) {
  const iface = new Interface(CONTRACT_ABI);
  const allVotesEvents = await contract.queryFilter(contract.filters.CastVote());
  const events = allVotesEvents.map((event) => {
    console.log(event)
    const decodedData = iface.decodeEventLog("CastVote", event.data);
    console.log(decodedData);
    const { address, blockHash, blockNumber, transactionHash, data } = event;
    return {
      address,
      blockHash,
      blockNumber,
      transactionHash,
      extraData: data,
      timestamp: parseInt(decodedData[3])
    }
  })

  return events;
}

export default function ElectionDisclosurePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter();
  const provider = new JsonRpcProvider(NODE_RPC_URL);
  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const [electionInfo, setElectionInfo] = useState({
    id: "",
    electionIndex: 0,
    title: "",
    startTime: 0,
    endTime: 0,
    candidates: [""],
    totalVoters: 0
  })
  const [electionHistories, setElectionHistories] = useState([]);

  contract.on("CastVote", (e) => {
    console.log(e);
  });

  contract.on("NewElection", (e) => {
    console.log(e);
  });

  (async () => {
    const iface = new Interface(CONTRACT_ABI);
    const allVotesEvents = await contract.queryFilter(contract.filters.NewElection())
    console.log(allVotesEvents)
    console.log("========== DECODE ==========")
    allVotesEvents.forEach((event) => {
      const log = iface.parseLog({
        data: event.data,
        topics: event.topics as string[],
      });
      console.log(event)
      console.log(log);

      const decodedData = iface.decodeEventLog("NewElection", event.data);
      console.log(decodedData[3], decodedData);
    })
    await getPastVoteEvents(contract);
    console.log("========== FINISH DECODE ==========");
  })();

  useEffect(() => {
    // get the election from on-chain (blockchain) dan off-chain (firebase)
    const callElectionData = async () => {
      const electionDetails = await getElectionDetails(contract, id);
      if (!electionDetails) {
        router.push("/");
        return;
      };
      const { id: electionId, electionIndex, title, startTime, endTime, candidates, totalVoters } = electionDetails
      setElectionInfo({
        title,
        id: electionId,
        electionIndex: electionIndex!!,
        startTime: startTime!!,
        endTime: endTime!!,
        candidates: candidates!!,
        totalVoters: totalVoters!!
      });
    }

    callElectionData();
  }, [setElectionInfo]);
  console.log("Election Info: ", electionInfo)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <section className="text-center pb-8">
        <h1 className="text-3xl py-4"> Information Disclosure </h1>
        <p>Tracking your elections process</p>
        <Table className="w-full mt-4">
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Timestamp</TableHead>
              <TableHead>Parent Hash</TableHead>
              <TableHead>Transaction Hash</TableHead>
              <TableHead>Block</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>

      </section>
    </main>
  )
}