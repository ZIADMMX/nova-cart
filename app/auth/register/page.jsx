"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import Link from "next/link" 
import { Mail, Lock, Loader2, Eye, EyeOff, UserPlus, User } from "lucide-react"
import { toast } from "react-toastify"

function RegisterForm() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const { register, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            toast.error("Passwords do not match")
            return
        }

        setIsLoading(true)

        const result = await register(email, password, username)
        if (result.success) {
            toast.success("Registration successful")
            router.push("/")
        } else {
            setError(result.error)
            toast.error(result.error)
        }
        setIsLoading(false)
    }

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Ambient decorative glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-8 shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/80">
                {/* Brand gradient line on top */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-indigo-500 to-purple-600" />

                <div className="text-center mt-4 mb-8">
                    <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex justify-center items-center mx-auto mb-4 shadow-lg shadow-purple-600/30">
                        <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mb-2 tracking-tight">
                        Create Account
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-semibold transition-colors">
                            Login
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-lg mb-6">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3">
                                <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="username"
                                className="w-full pl-14 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all duration-200"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3">
                                <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full pl-14 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all duration-200"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3">
                                <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full pl-14 pr-12 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all duration-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
                            >
                                {showPassword ? (
                                    <Eye className="w-5 h-5" />
                                ) : (
                                    <EyeOff className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3">
                                <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full pl-14 pr-12 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all duration-200"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
                            >
                                {showPassword ? (
                                    <Eye className="w-5 h-5" />
                                ) : (
                                    <EyeOff className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center cursor-pointer gap-2 py-2.5 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-purple-600/25"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <UserPlus className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="w-full max-w-md relative z-10">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-8 shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/80 min-h-[460px] flex flex-col justify-center items-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading form...</span>
            </div>
        </div>
    )
}

export default function Register() {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    return (
        <div className="relative flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Soft top lighting glow */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-linear-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
            
            {mounted ? <RegisterForm /> : <LoadingFallback />}
        </div>
    )
}
