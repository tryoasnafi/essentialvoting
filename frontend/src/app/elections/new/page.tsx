"use client"

import * as z from "zod"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast";
import InputCandidates from "@/components/ui/elections/input-candidates"
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ButtonLoading } from "@/components/ui/custom/button-loading";
import { ethers } from "ethers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge";

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

function newWallet() {
  const wallet = ethers.Wallet.createRandom();
  return wallet
}

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
      const header = csvLines.shift();
      const voters: Voter[] = csvLines.map((line, i) => {
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

function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

interface PrivateKeyAlertProps {
  privateKey: string
  electionTitle: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function PrivateKeyAlert({ privateKey, electionTitle, isOpen, setIsOpen }: PrivateKeyAlertProps) {
  const formattedTitle = electionTitle.toLowerCase().replaceAll(" ", "-");
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save your secret phrase!</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            <p className="flexgap-2 my-4">{privateKey}</p>
            <small className="text-red-500">We don't save your secret phrase, make sure it's safe, and don't share it, becareful it loss permanently, we can't recover it</small>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => {
            // download phrases
            download(`privatekey_${formattedTitle}.txt`, privateKey);
            setIsOpen(false);
          }}>I understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function OrganizersLogin() {
  const initialStartTime = new Date();
  const initialEndTime = new Date(initialStartTime.getTime() + 30 * 60000);
  const [isPrivateKeyDialogOpen, setIsPrivateKeyDialogOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [electionTitle, setElectionTitle] = useState("");

  const form = useForm<z.infer<typeof ElectionSchema>>({
    resolver: zodResolver(ElectionSchema),
    defaultValues: {
      startTime: initialStartTime,
      endTime: initialEndTime,
      candidates: [
        { "value": "" },
        { "value": "" }
      ]
    }
  })

  async function onSubmit(values: z.infer<typeof ElectionSchema>) {
    console.log(values)
    console.log(values.votersCsv[0])
    const text = await parseCsv(values.votersCsv[0]);
    const walletOrganizer = newWallet();

    setElectionTitle(values.votingName);
    setPrivateKey(walletOrganizer.privateKey);
    setIsPrivateKeyDialogOpen(true);

    // toast({
    //   title: "Voting Events:",
    //   description: (
    //     <pre>{JSON.stringify(values, null, 2)}</pre>
    //   ),
    // })
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
        isOpen={isPrivateKeyDialogOpen}
        setIsOpen={setIsPrivateKeyDialogOpen} />
    </main>
  )
}