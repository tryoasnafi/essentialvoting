"use client"

import * as z from "zod"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { completeSignIn, getElectionsByEmail, sendOneTimeLink } from "@/lib/firebase-config";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email(),
})

function setIsOneTimeLinkSent(value: string) {
  window.localStorage.setItem("isOneTimeLinkSent", value);
}

export default function VotersLogin() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const elections = await getElectionsByEmail(values.email);
    if (elections.length < 1) {
      toast({
        variant: "destructive",
        title: "You don't have any elections",
        description: "Register your email to an election organizer",
      });
      return false;
    }

    window.localStorage.setItem("electionId", elections[elections.length - 1].id);

    const CURRENT_URL = `http://${window.location.host}/voters/login`;
    const [message, isSuccess] = await sendOneTimeLink(values.email, CURRENT_URL);
    if (!isSuccess) {
      setIsOneTimeLinkSent("0");
      toast({
        title: "Error",
        description: message,
      })
      return false;
    }

    setIsOneTimeLinkSent("1");
    toast({
      title: "Please check your email",
      description: (
        <p>{message}. Email verification has been sent to {values.email}</p>
      ),
    })
  }

  useEffect(() => {
    const checkOneTimeLink = async () => {
      const isOneTimeLinkSent = window.localStorage.getItem("isOneTimeLinkSent");
      console.log(isOneTimeLinkSent);
      if (isOneTimeLinkSent == "1") {
        const isValid = await completeSignIn();
        console.log(isValid);
        const electionId = window.localStorage.getItem("electionId");
        console.log(electionId);
        if (isValid) {
          const ELECTION_URL = `http://${window.location.host}/elections/${electionId}/vote`;
          setIsOneTimeLinkSent("0");
          router.push(ELECTION_URL);
        }
      }
    }

    checkOneTimeLink();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl pb-8 -mt-24"> Voter Verification </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row w-full max-w-md px-4 space-y-8">
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem className="mr-2">
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="mail@example.com" {...field} />
        </FormControl>
        <FormDescription>
          This is your voting email registered by organizer.
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
          <Button type="submit"><Mail className="mr-2 h-4 w-4" /> Verify </Button>
        </form>
      </Form>
    </main>
  )
}