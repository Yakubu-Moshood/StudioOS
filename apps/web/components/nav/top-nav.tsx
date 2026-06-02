import Link from 'next/link'
import { UserMenu } from '@/components/nav/user-menu'

interface TopNavProps {
  email: string
  displayName: string | null
}

export function TopNav({ email, displayName }: TopNavProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          StudioOS
        </Link>
        <UserMenu email={email} displayName={displayName} />
      </div>
    </header>
  )
}
