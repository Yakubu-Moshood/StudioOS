import Link from 'next/link'
import { FraymIQLogo } from '@/components/brand/fraymiq-logo'
import { UserMenu } from '@/components/nav/user-menu'

interface TopNavProps {
  email: string
  displayName: string | null
}

export function TopNav({ email, displayName }: TopNavProps) {
  return (
    <header className="border-b border-[#e4ebe8] bg-[#fbfaf7]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        <Link href="/dashboard" aria-label="FraymIQ dashboard">
          <FraymIQLogo />
        </Link>
        <UserMenu email={email} displayName={displayName} />
      </div>
    </header>
  )
}
