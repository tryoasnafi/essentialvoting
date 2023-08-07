"use client"

import * as z from "zod"
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuthContext } from "@/context/auth-context";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getElectionById, getVoterKey as getVoterKeyByEmail } from "@/lib/firebase-config";
import { Wallet, ethers } from "ethers";
import { NODE_RPC_URL, PROVIDER, getContract, getElectionDetails } from "@/lib/contract";

const formSchema = z.object({
  candidate: z.string(),
})

export default function VotingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { voter, loading } = useAuthContext();
  const key = useRef("");
  const address = useRef("");
  const balance = useRef(0);
  const [electionInfo, setElectionInfo] = useState({
    id: "",
    electionIndex: 0,
    title: "",
    startTime: 0,
    endTime: 0,
    candidates: [{ value: "", label: "candidate" }],
    totalVoters: 0
  });
  // TODO: the private key should keep private and not be stored in the database
  // now for simplity, it is stored in the database 
  useEffect(() => {
    if (!loading) {
      if (!voter.uid) {
        router.push("/voters/login");
        return;
      }

      const callElectionData = async () => {
        // validate private key
        const [data, isSuccess] = await getVoterKeyByEmail(voter.email);
        if (!isSuccess) return;
        key.current = data

        const signer = new Wallet(data, PROVIDER);
        address.current = signer.address;
        console.log("address", signer.address);
        const contract = getContract(signer);
        console.log("contract", contract);
        PROVIDER.getBalance(signer.address).then((b) => {
          console.log("balance", b);
          balance.current = parseInt(`${b}`);
        })

        const electionDetails = await getElectionDetails(contract, id);
        console.log("electionDetails", electionDetails);
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
          candidates: candidates!!.map((c: string, i: number) => ({ value: `${i}`, label: c })),
          totalVoters: totalVoters!!
        });
      }

      callElectionData();
    }
  }, [voter, loading, id, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidate: "",
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const signer = new Wallet(key.current, PROVIDER);
      const contract = getContract(signer);
      const data = await getElectionById(id);
      if (!data) {
        router.push("/");
        return;
      }
      const { electionIndex } = data;
      console.log(electionIndex, values.candidate);
      await contract.castVote(electionIndex, parseInt(values.candidate));
      console.log(values);
      toast({
        title: `Congratulations! You have voted`,
        description: (
          <p> Cast Vote for {electionInfo.title} recorded successfully </p>
        ),
      })
      router.push(`/elections/${id}/disclosure`);
      // userSignOut();
    } catch (e: any) {
      console.log(e.message);
      const revertedReason = e.message.split(", ")[2].split("=")[1];
      toast({
        variant: "destructive",
        title: "Casting Vote Failed",
        description: (
          <p> Vote reverted: {revertedReason ?? e.message}</p>
        ),
      })
    }

  }

  return (
    !loading ? (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-3xl pb-8 mt-24"> {electionInfo.title} </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full max-w-md px-4 space-y-8">
            <FormField
              control={form.control}
              name="candidate"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Choose your candidate.</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      className="flex flex-col space-y-1"
                    >
                      {electionInfo.candidates.map((candidate: { value: string; label: string; }) => (
                        <FormItem key={candidate.value} className="flex items-center space-x-3 space-y-0 py-2 px-3 border border-gray-200 rounded dark:border-gray-700 hover:bg-purple-300">
                          <FormControl>
                            <RadioGroupItem value={candidate.value} />
                          </FormControl>
                          <FormLabel className="w-full font-medium text-lg cursor-pointer">{candidate.label}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm text-gray-500"> This is your address: <br /> {address.current} <br /> with balance {ethers.formatEther(balance.current)} ETH </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!form.formState.isDirty}>
                  <Send className="mr-2 h-4 w-4" /> Submit your choice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure about your choice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undo. Your choice will permanently recorded in blockchain.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => form.handleSubmit(onSubmit)()}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {/* <ButtonLoading message="Loading" /> */}
          </form>
        </Form>
      </main>
    ) : "Loading ..."
  )
}