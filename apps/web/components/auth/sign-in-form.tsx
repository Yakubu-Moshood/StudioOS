'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Lock, Mail, Play, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { FraymIQLogo } from '@/components/brand/fraymiq-logo'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden px-12 py-10 lg:flex lg:flex-col">
        <FraymIQLogo showPlatformLabel />

        <div className="mt-24 max-w-xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-[#2f7f73]">Creative production workflow</p>
          <h1 className="text-6xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#0f2433]">
            Plan. Create. Collaborate. Deliver.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[#667780]">
            Everything your production needs in one clear workspace, from first brief to final delivery.
          </p>
        </div>

        <div className="relative mt-14 h-[430px] max-w-2xl">
          <div className="absolute left-8 top-6 rounded-3xl border border-[#dce8e4] bg-white/80 p-5 shadow-xl shadow-[#0f2433]/5 backdrop-blur">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]"><Workflow className="h-5 w-5" /></div>
            <p className="text-sm font-semibold text-[#0f2433]">Plan</p>
            <p className="mt-1 text-xs text-[#7c8b92]">Creative brief</p>
          </div>

          <div className="absolute left-64 top-28 rounded-3xl border border-[#dce8e4] bg-white/85 p-5 shadow-xl shadow-[#0f2433]/5 backdrop-blur">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3f8] text-[#547896]"><Play className="h-5 w-5" /></div>
            <p className="text-sm font-semibold text-[#0f2433]">Produce</p>
            <p className="mt-1 text-xs text-[#7c8b92]">Tasks and runs</p>
          </div>

          <div className="absolute bottom-24 left-32 rounded-3xl border border-[#dce8e4] bg-white/85 p-5 shadow-xl shadow-[#0f2433]/5 backdrop-blur">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]"><CheckCircle2 className="h-5 w-5" /></div>
            <p className="text-sm font-semibold text-[#0f2433]">Approve</p>
            <p className="mt-1 text-xs text-[#7c8b92]">Versioned artifacts</p>
          </div>

          <div className="absolute bottom-8 right-8 rounded-3xl border border-[#dce8e4] bg-white/85 p-5 shadow-xl shadow-[#0f2433]/5 backdrop-blur">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]"><ArrowRight className="h-5 w-5" /></div>
            <p className="text-sm font-semibold text-[#0f2433]">Deliver</p>
            <p className="mt-1 text-xs text-[#7c8b92]">Production package</p>
          </div>

          <div className="absolute bottom-0 left-4 h-36 w-[520px] rounded-[2rem] border border-[#dce8e4] bg-white/55 p-4 shadow-inner">
            <div className="mb-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-12 flex-1 rounded-xl bg-[#dfe9e5]" />)}
            </div>
            <div className="h-3 w-3/4 rounded-full bg-[#2f7f73]/45" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-[#547896]/35" />
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[460px] rounded-[2rem] border border-[#e1e7e4] bg-white/90 p-8 shadow-2xl shadow-[#0f2433]/10 backdrop-blur sm:p-10">
          <div className="mb-10 lg:hidden">
            <FraymIQLogo showPlatformLabel />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Sign in to your account</h2>
            <p className="text-sm text-[#667780]">Welcome back. Continue your production workflow.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0f2433]">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8b92]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="h-12 rounded-2xl border-[#d8e2de] bg-white pl-10 focus-visible:ring-[#2f7f73]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0f2433]">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8b92]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-12 rounded-2xl border-[#d8e2de] bg-white pl-10 focus-visible:ring-[#2f7f73]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#667780]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#c9d8d3] accent-[#2f7f73]" />
                Remember me
              </label>
              <Link href="/reset-password" className="font-medium text-[#2f7f73] hover:text-[#24655c]">Forgot password?</Link>
            </div>

            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <Button type="submit" className="h-12 w-full rounded-2xl bg-[#2f7f73] text-white shadow-lg shadow-[#2f7f73]/20 hover:bg-[#24655c]" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-[#667780]">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-medium text-[#2f7f73] hover:text-[#24655c]">
              Sign up
            </Link>
          </p>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-[#7c8b92]">
            <Lock className="h-3.5 w-3.5" /> Secure access. Your data is protected.
          </p>
        </div>
      </section>
    </main>
  )
}
