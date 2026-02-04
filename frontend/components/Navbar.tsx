'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { LogOut, User } from "lucide-react"

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            AI Food Logger
          </Link>
          {user && (
            <div className="hidden md:flex gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Link href="/log" className="text-sm font-medium hover:text-primary">
                Log Food
              </Link>
              <Link href="/history" className="text-sm font-medium hover:text-primary">
                History
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
