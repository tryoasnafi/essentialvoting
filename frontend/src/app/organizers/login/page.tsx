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
  privateKey: z.string().min(66).max(66),
})

export default function OrganizersLogin() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "Your Private Key",
      description: (
        <pre>{values.privateKey}</pre>
      ),
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <section className="text-center pb-8 -mt-24">
        <h1 className="text-3xl pb-2"> Organizer Login </h1>
        <p>Use your organizer private key from elections.</p>
      </section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full max-w-md px-2 space-y-8">
          <FormField
            control={form.control}
            name="privateKey"
            render={({ field }) => (
              <FormItem className="mr-2">
                <FormLabel>Election Private Key</FormLabel>
                <FormControl>
                  <Input placeholder="0x........." type="password" {...field} />
                </FormControl>
                <FormDescription>
                  64 hexadecimal character with prefix 0x.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit"> Submit </Button>
          {/* <ButtonLoading message="Loading" /> */}
        </form>
      </Form>
    </main>
  )
}