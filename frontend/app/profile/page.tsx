"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import ProfileForm from "@/components/ProfileForm"

export default function ProfilePage() {
  const router = useRouter()

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-background">
      <button
        onClick={() => router.back()}
        className="absolute top-0 left-0 z-10 flex items-center gap-1 text-sm cursor-pointer hover:text-foreground transition-colors"
        style={{ padding: 16, color: "rgba(255,255,255,0.5)", background: "none", border: "none" }}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>
      <ProfileForm />
    </main>
  )
}
