'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomBarChart from "@/components/ui/custom/bar-chart";
import CustomPieChart from "@/components/ui/custom/pie-chart";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CastVoteEventLog, PROVIDER, getContract, getElectionDetails, getPastVoteEvents } from "@/lib/contract";
import { now, timer, timestampToDateString } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const DEFAULT_CANDIDATE_VOTES = [
  { name: "", votes: 0 },
  { name: "", votes: 0},
];

const DEFAULT_VOTES_ABSTAINS = [
  { name: 'Total Votes', value: 0 },
  { name: 'Total Abstain', value: 0 },
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
  electionInfo: ElectionInfo,
  castVoteEvents: CastVoteEventLog[],
  setCastVoteEvents: Dispatch<SetStateAction<CastVoteEventLog[]>>
}

export default function ElectionDisclosurePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter();
  const [ candidateVotes, setCandidateVotes ] = useState(DEFAULT_CANDIDATE_VOTES);
  const [ votesVsAbstains, setVotesVsAbstains ] = useState(DEFAULT_VOTES_ABSTAINS);
  const [ remainingTime, setRemainingTime ] = useState(0);
  const [ castVoteEvents, setCastVoteEvents ] = useState<CastVoteEventLog[]>([]);
  const [ isFinish, setIsFinish ] = useState<boolean>(false);

  const [electionInfo, setElectionInfo] = useState<ElectionInfo>({
    id: "",
    electionIndex: 0,
    title: "",
    startTime: 0,
    endTime: 0,
    candidates: [""],
    totalVoters: 0
  })

  // use effect when first render
  useEffect(() => {
    // get the election from on-chain (blockchain) dan off-chain (firebase)
    const callElectionData = async () => {
      const contract = getContract(await PROVIDER.getSigner());
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
    };

    callElectionData();

    return () => {
      callElectionData();
    }
  }, [isFinish]);

  useEffect(() => {
    // statistics
    if (electionInfo.totalVoters !== 0) {
      setVotesVsAbstains([
        { name: 'Total Votes', value: castVoteEvents.length },
        { name: 'Total Abstain', value: (electionInfo.totalVoters - castVoteEvents.length) },
      ]);
    }
  }, [castVoteEvents, electionInfo]);

  useEffect(() => {
    const listenToCastVoteEvent = async () => {
      const contract = getContract(await PROVIDER.getSigner());
      contract.on("CastVote", async(from, electionIndex, candidateId, timestamp, payloads) => {
        if (parseInt(timestamp) > electionInfo.endTime) return; 
        if (parseInt(electionIndex) !== electionInfo.electionIndex) return;
    
        const { address, transactionHash, blockHash, blockNumber } = payloads?.log
        const found = castVoteEvents.findIndex(event => event.transactionHash === transactionHash);
        if (found !== -1) return;
    
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
    };

    listenToCastVoteEvent();

    return () => {
      listenToCastVoteEvent();
    }
  }, [castVoteEvents]);

  // use effect for timer
  useEffect(() => {
    if (isFinish) return;

    const intervalId = setInterval(() => {
      if (electionInfo.endTime - now() <= 0) {
        setIsFinish(true);
      }
      setRemainingTime(electionInfo.endTime - now());
    }, 1000)
    
    return () => clearInterval(intervalId);
  }, [electionInfo]);

  // use efffect when finish
  useEffect(() => {
    const tallyTheVotes = async () => {
      const contract = getContract(await PROVIDER.getSigner());
      let candidateWithVotes = [];
      for (let i = 0; i < electionInfo.candidates.length; i++) {
        const votes = await contract.getTally(electionInfo.electionIndex, i);
        console.log(votes, );
        candidateWithVotes.push({ name: electionInfo.candidates[i], votes: parseInt(votes) })
      }
      console.log("LOG", candidateWithVotes);
      setCandidateVotes(candidateWithVotes);
    }

    if (isFinish) {
      tallyTheVotes();
    }

    return () => {
      tallyTheVotes();
    }
  }, [isFinish]);

  const handleDownload = () => {
    // download as csv
    let data = "from,electionIndex,candidateId,timestamp,blockNumber,blockHash,transactionHash\n";
    data += castVoteEvents.map(vote => [
      vote.from,
      vote.electionIndex,
      vote.candidateId,
      vote.timestamp,
      vote.blockNumber,
      vote.blockHash,
      vote.transactionHash
    ]).join("\n");
    const blob = new Blob([data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${electionInfo.title}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <section className="w-full text-center pb-8">
        <h1 className="text-3xl pt-4"> Information Disclosure </h1>
        <h2 className="text-xl font-bold py-4">{electionInfo.title}</h2>
        <div className="flex w-fit py-4 space-x-2 mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{timestampToDateString(electionInfo.startTime)}</CardTitle>
            </CardHeader>
            <CardContent>Start Time</CardContent>
          </Card>
          <Card className="bg-black text-white">
            <CardHeader>
              <CardTitle>{(now() >= electionInfo.startTime) && timer(remainingTime)}</CardTitle>
            </CardHeader>
            <CardContent>Remaining Time</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{timestampToDateString(electionInfo.endTime)}</CardTitle>
            </CardHeader>
            <CardContent>End Time</CardContent>
          </Card>
        </div>
        { 
          isFinish &&        
          <Button className="py-4" onClick={handleDownload}>Download Result</Button>
        }
        <div className="flex flex-row justify-center py-4 space-x-4">
          { isFinish && (
            <Card className="basis-1/2">
              <CardHeader>
                <CardTitle>Vote Result</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <CustomBarChart data={candidateVotes} />
              </CardContent>
            </Card>
          )}
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
                <TableCell className="font-medium">{timestampToDateString(event.timestamp).toLocaleString()}</TableCell>
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