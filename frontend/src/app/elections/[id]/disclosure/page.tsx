'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomBarChart from "@/components/ui/custom/bar-chart";
import CustomPieChart from "@/components/ui/custom/pie-chart";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTRACT_ABI, CONTRACT_ADDRESS, CastVoteEventLog, NODE_RPC_URL, PROVIDER, getElectionDetails, getPastVoteEvents } from "@/lib/contract";
import { getElectionById } from "@/lib/firebase-config";
import { Election } from "@/lib/types";
import { now, timestampToDate } from "@/lib/utils";
import { Contract, JsonRpcProvider } from "ethers";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const DEFAULT_CANDIDATE_VOTES = [
  {
    name: "Luffy D. Monkey",
    votes: Math.floor(Math.random() * 100) + 50,
  },
  {
    name: "Zoro Roronoa",
    votes: Math.floor(Math.random() * 100) + 50,
  },
  {
    name: "Sanji Vinsmoke",
    votes: Math.floor(Math.random() * 100) + 50,
  },
];

const DEFAULT_VOTES_ABSTAINS = [
  { name: 'Total Votes', value: 103 },
  { name: 'Total Abstain', value: Math.floor(Math.random() * 10) + 23 },
];


interface ElectionInfo {
  id: string,
  electionIndex: number,
  title: string,
  startTime: number,
  endTime: number,
  candidates: string[],
  totalVoters: number
}

interface ListenEvent {
  contract: Contract,
  electionInfo: ElectionInfo,
  castVoteEvents: CastVoteEventLog[],
  setCastVoteEvents: Dispatch<SetStateAction<CastVoteEventLog[]>>
}

function listenToCastVoteEvent({contract, electionInfo, castVoteEvents, setCastVoteEvents}: ListenEvent) {
  contract.on("CastVote", async(from, electionIndex, candidateId, timestamp, payloads) => {
    if (parseInt(timestamp) > electionInfo.endTime) return; 
    if (parseInt(electionIndex) !== electionInfo.electionIndex) return;

    const { address, transactionHash, blockHash, blockNumber } = payloads?.log
    const found = castVoteEvents.findIndex(event => event.transactionHash === transactionHash);
    if (found !== -1) return;

    console.log(from, electionIndex, candidateId, timestamp)
    console.log(payloads);
    setCastVoteEvents([...castVoteEvents, {
      contractAddress: address,
      from: from,
      electionIndex: parseInt(electionIndex),
      candidateId: parseInt(candidateId),
      blockHash,
      blockNumber,
      transactionHash,
      timestamp: parseInt(timestamp)
    }]);
  });
}


export default function ElectionDisclosurePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter();
  const [ candidateVotes, setCandidateVotes ] = useState(DEFAULT_CANDIDATE_VOTES);
  const [ votesVsAbstains, setVotesVsAbstains ] = useState(DEFAULT_VOTES_ABSTAINS);
  const [ remainingTime, setRemainingTime ] = useState(0);
  const [ castVoteEvents, setCastVoteEvents ] = useState<CastVoteEventLog[]>([]);

  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, PROVIDER);
  const [electionInfo, setElectionInfo] = useState<ElectionInfo>({
    id: "",
    electionIndex: 0,
    title: "",
    startTime: 0,
    endTime: 0,
    candidates: [""],
    totalVoters: 0
  })

  useEffect(() => {
    // get the election from on-chain (blockchain) dan off-chain (firebase)
    const callElectionData = async () => {
      const electionDetails = await getElectionDetails(contract, id);
      if (!electionDetails) {
        router.push("/");
        return;
      };
      const { id: electionId, electionIndex, title, startTime, endTime, candidates, totalVoters } = electionDetails;
      setElectionInfo({
        title,
        id: electionId,
        electionIndex: electionIndex!!,
        startTime: startTime!!,
        endTime: endTime!!,
        candidates: candidates!!,
        totalVoters: totalVoters!!
      });

      // event log of cast votes
      const events = await getPastVoteEvents(contract, electionIndex ?? 0);
      setCastVoteEvents(events);
      
      // statistics
      setVotesVsAbstains([
        { name: 'Total Votes', value: events.length },
        { name: 'Total Abstain', value: (totalVoters!! - events.length) },
      ]);

      const candidateAndVotest =  candidates!!.map(async(candidate, index) => {
        const votes = await contract.getTally(electionIndex, index);
        return { name: candidate, votes: parseInt(votes) };
      });

      setCandidateVotes(await Promise.all(candidateAndVotest));
    };

    listenToCastVoteEvent({contract, electionInfo, castVoteEvents, setCastVoteEvents});
    callElectionData();
  }, [setElectionInfo]);
  
  useEffect(() => {
    if (electionInfo.endTime - now() < 0) return;

    const intervalId = setInterval(() => {
      setRemainingTime(electionInfo.endTime - now());
    }, 1000)
    
    return () => clearInterval(intervalId);
  }, [electionInfo]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <section className="w-full text-center pb-8">
        <h1 className="text-3xl pt-4"> Information Disclosure </h1>
        <h2 className="text-xl font-bold py-4">{electionInfo.title}</h2>
        <div className="flex w-fit py-4 space-x-2 mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{timestampToDate(electionInfo.startTime).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>Start Time</CardContent>
          </Card>
          <Card className="bg-black text-white">
            <CardHeader>
              <CardTitle>{timestampToDate(remainingTime).toLocaleTimeString()}</CardTitle>
            </CardHeader>
            <CardContent>Remaining Time</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{timestampToDate(electionInfo.endTime).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>End Time</CardContent>
          </Card>
        </div> 
        <div className="flex flex-row justify-center py-4 space-x-4">
          <Card className="basis-1/2">
            <CardHeader>
              <CardTitle>Vote Result</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <CustomBarChart data={candidateVotes} />
            </CardContent>
          </Card>
          
          <Card className="basis-1/2">
            <CardHeader>
              <CardTitle>Total Vote vs Abstain</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <CustomPieChart data={votesVsAbstains} />
            </CardContent>
          </Card>
        </div>
        <Table className="w-full mt-4">
          <TableCaption>Tracking events of cast vote.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Timestamp</TableHead>
              <TableHead>Voter Address</TableHead>
              <TableHead>Transaction Hash</TableHead>
              <TableHead>Block</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-left">
            {castVoteEvents.map((event, index) => (
              <TableRow key={event.transactionHash}>
                <TableCell className="font-medium">{timestampToDate(event.timestamp).toLocaleString()}</TableCell>
                <TableCell>{event.from}</TableCell>
                <TableCell>{event.transactionHash}</TableCell>
                <TableCell>{event.blockNumber}</TableCell>
                <TableCell className="">{event.extraData}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}