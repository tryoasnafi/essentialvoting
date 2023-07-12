import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <section className="text-center pb-12 -mt-24">
        <h1 className="text-3xl pb-2"> Welcome to Essential Votes </h1>
        <p>Secure and trustful elections backed by blockchain technology.</p>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <Button asChild>
          <Link href="/elections/new">New Election</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Login as <ChevronDown className="ml-2 h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href="/voters/login">Voters</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/organizers/login">Organizers</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </main >
  )
}
