import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl pb-8 -mt-24"> Login as </h1>
      <div className="grid grid-cols-2 gap-4">
        <Button asChild>
          <Link href="/voters/login">Voters</Link>
        </Button>
        <Button asChild>
          <Link href="/organizers/login">Organizers</Link>
        </Button>
      </div>
    </main>
  )
}
