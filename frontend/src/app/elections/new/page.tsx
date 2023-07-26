"use client"

import * as z from "zod"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast";
import InputCandidates from "@/components/ui/elections/input-candidates"
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";
import { useRef, useState } from "react";
import { BaseWallet, Contract, JsonRpcProvider, Signer, Wallet } from "ethers";
import { dateToTimestamp, generateUUID } from "@/lib/utils";
import { CONTRACT_ABI, CONTRACT_ADDRESS, NODE_RPC_URL } from "@/lib/contract";
import PrivateKeyAlert from "@/components/ui/custom/private-key-alert";
import { getVoterAddress, getVoterKey, saveElection, saveVoterKey } from "@/lib/firebase-config";

const MEGABYTE = 1024 * 1024;
const MAX_FILE_SIZE_MB = 2;
const ACCEPTED_FILE_TYPES = ["text/csv"];

// TODO: add more precise validation for votersCsv
const ElectionSchema = z.object({
  votingName: z.string().min(1).max(50),
  votingDescription: z.string().max(256).optional(),
  candidates: z.array(
    z.object({
      value: z.string().min(1),
    })
  ).min(2),
  startTime: z.date(),
  endTime: z.date(),
  votersCsv: z.custom<FileList>(),
})

interface Voter {
  name: string;
  email: string;
}

function parseCsv(file: File, separator = ","): Promise<Voter[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const textCsv: string = evt.target?.result as string;
      const csvLines = textCsv.split(/\r?\n/);
      csvLines.shift();
      const voters: Voter[] = csvLines.map((line) => {
        const values = line.split(separator);
        return {
          name: values[0],
          email: values[1],
        } as Voter
      })
      console.log(voters);
      resolve(voters);
    };
    reader.onerror = (evt) => {
      reject(evt.target?.error);
    }
    reader.readAsText(file);
  })
}

function getContract(runner: Signer): Contract {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, runner);
}

function newWallet(privateKey?: string): BaseWallet {
  if (privateKey) {
    return new Wallet(privateKey);
  }
  return Wallet.createRandom();
}

function generateWallets(total: number) {
  // generate wallet for total
  let wallets = [];
  for(let i = 0; i < total; i++) {
    wallets.push(newWallet());
  }
  return wallets;
}

const provider = new JsonRpcProvider(NODE_RPC_URL);
provider.on("block", async (blockNumber) => {
  const block = await provider.getBlock(blockNumber, true);
  console.log("New block:", block);
  console.log("Transactions:", block?.prefetchedTransactions);
});


export default function OrganizersLogin() {
  const initialStartTime = new Date((new Date).getTime() + 30 * 60000);
  const initialEndTime = new Date(initialStartTime.getTime() + 30 * 60000);
  const [isPrivateKeyDialogOpen, setIsPrivateKeyDialogOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [electionTitle, setElectionTitle] = useState("");
  const uuid = useRef(generateUUID());
  const disclosurePageUrl = `/elections/${uuid.current}/disclosure`;

  // TODO: inserting each address voters
  // TODO: insert voter email and wallet secret phrases to firebase

  const form = useForm<z.infer<typeof ElectionSchema>>({
    resolver: zodResolver(ElectionSchema),
    defaultValues: {
      startTime: initialStartTime,
      endTime: initialEndTime,
      candidates: [
        { "value": "" },
        { "value": "" }
      ],
      votingDescription: "",
      votingName: "",
    }
  })

  async function onSubmit(values: z.infer<typeof ElectionSchema>) {
    console.log(values)
    console.log(values.votersCsv[0])
    const voters = await parseCsv(values.votersCsv[0]);
    const walletOrganizer = Wallet.createRandom();
    const randomWalletVoter = generateWallets(voters.length);

    const owner = await provider.getSigner();
    const electionContract = getContract(owner);
    try {
      await electionContract.createElection(
        values.votingName,
        values.candidates.map(c => c.value),
        dateToTimestamp(values.startTime),
        dateToTimestamp(values.endTime), 
        randomWalletVoter.map((w) => w.address)
      );

      const lastIndex = parseInt(await electionContract.counter()) - 1;
      console.log("counter: ", lastIndex);
      
      // save election metadata to firebase
      await saveElection({
        id: uuid.current,
        title: values.votingName,
        voterEmails: voters.map((voter) => voter.email),
        electionIndex: lastIndex,
      });

      console.log(await electionContract.getElectionByIndex(lastIndex));

      // send eth to each wallet
      const ONE_PERMILLE_ETH = "1000000000000000";
      randomWalletVoter.forEach(async (wallet, i) => {
        const [address, isExist] = await getVoterAddress(voters[i].email);
        let walletAddress = wallet.address;
        // if (!isExist) walletAddress = address;
        
        await owner.sendTransaction({
          to: walletAddress,
          value: ONE_PERMILLE_ETH,
        });

        // binding wallet to voter
        saveVoterKey(voters[i].email, wallet.address.toLowerCase(), wallet.privateKey);
      });

      toast({
        title: "Election Created Successfully",
        description: (
          <pre>{JSON.stringify(values, null, 2)}</pre>
        ),
      })
      
      // clear Form
      // form.reset();
    } catch (error: any) {
      const revertedReason = error.message.split(", ")[2].split("=")[1];
      toast({
        variant: "destructive",
        title: "Election Creation Failed",
        description: (
          <p>Execution reverted: {revertedReason}</p>
        ),
      })
    }

    setElectionTitle(values.votingName);
    setPrivateKey(walletOrganizer.privateKey);
    setIsPrivateKeyDialogOpen(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <section className="text-center pb-8">
        <h1 className="text-3xl py-4"> Essential Voting </h1>
        <p>Make your organizational voting with us.</p>
      </section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full max-w-md px-2 space-y-8">
          <FormField
            control={form.control}
            name="votingName"
            render={({ field }) => (
              <FormItem className="mr-2">
                <FormControl>
                  <Input placeholder="Title of Voting Event" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="votingDescription"
            render={({ field }) => (
              <FormItem className="mr-2">
                <FormControl>
                  <Input placeholder="Description about this voting event" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <InputCandidates form />
          </div>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <DateTimePicker date={initialStartTime} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <DateTimePicker date={initialEndTime} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="votersCsv"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Voters CSV</FormLabel>
                  <FormControl>
                    <Input type="file" accept="text/csv" onChange={(e) => {
                      if (e.target?.files) {
                        field.onChange(e.target.files);
                      }
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* {BUTTON_STATE()} */}
          <Button type="submit"> Submit </Button>
          {/* <ButtonLoading message="Loading" /> */}
        </form>
      </Form>
      <PrivateKeyAlert
        privateKey={privateKey}
        electionTitle={electionTitle}
        redirectUrl={disclosurePageUrl}
        isOpen={isPrivateKeyDialogOpen}
        setIsOpen={setIsPrivateKeyDialogOpen} />
    </main>
  )
}