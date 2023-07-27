import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Mail } from 'lucide-react'
import { userSignOut } from '@/lib/firebase-config'


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <section className="text-center pb-12 -mt-24">
        <h1 className="text-3xl pb-2"> Welcome to Essential Votes </h1>
        <p>Secure and trustful elections backed with blockchain technology.</p>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <Button asChild>
          <Link href="/elections/new">New Election</Link>
        </Button>
        <Button variant="outline">
          <Link href="/voters/login" className='flex items-center'> <Mail className="mr-2 h-4 w-4" /> Vote</Link>
        </Button>
      </div>
    </main >
  )
}
