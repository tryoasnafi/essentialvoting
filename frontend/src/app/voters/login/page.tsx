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

const formSchema = z.object({
  email: z.string().email(),
})

export default function VotersLogin() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "Please check your email",
      description: (
        <p>Email verification has been sent to {values.email}</p>
      ),
    })
  }

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
                  <Input placeholder="mail@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  This is your voting email registered by organizer.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit"><Mail className="mr-2 h-4 w-4" /> Verify </Button>
          {/* <ButtonLoading message="Loading" /> */}
        </form>
      </Form>
    </main>
  )
}