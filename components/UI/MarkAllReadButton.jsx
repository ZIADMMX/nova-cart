"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck, Loader2 } from "lucide-react"

export default function MarkAllReadButton({ onSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handelMarkAllRead = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/notifications/mark-all-read", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            if (res.ok) {
                if (onSuccess) onSuccess();
                router.refresh()
            } else {
                try {
                    const error = await res.json()
                    console.error("Failed to mark all read:", error)
                } catch {
                    console.error("Failed to mark all read")
                }
            }
        } catch (error) {
            console.error("Error marking all read:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button 
            onClick={handelMarkAllRead} 
            disabled={isLoading}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 font-bold cursor-pointer backdrop-blur-xs disabled:opacity-50"
        >
            {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <CheckCheck className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? "جاري التحديث..." : "تحديد الكل كمقروء"}</span>
        </button>
    )
}
