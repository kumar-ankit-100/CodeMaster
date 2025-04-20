"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { X, Github, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthDialogProps {
    isOpen: boolean
    onClose: () => void
    onLogin: () => void
}

export default function AuthDialog({ isOpen, onClose, onLogin }: AuthDialogProps) {
    const [authMode, setAuthMode] = useState<"login" | "signup">("login")
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")

    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            // We use the same endpoint for both login and signup
            // The backend will handle creating a new user or authenticating an existing one
            const result = await signIn("credentials", {
                redirect: false,
                username: email,
                password: password,
                names : name,
                authType: authMode,
                // Using the current path instead of hardcoded "/"
                callbackUrl: window.location.pathname,
            })

            if (result?.error) {
                setError("Authentication failed. Please check your credentials.")
            } else {
                // Authentication successful
                onLogin()
                onClose()
                // Refresh the page to update the auth state
                router.refresh()
            }
        } catch (error) {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialSignIn = (provider: string) => {
        // When using social sign-in, redirect to the current page
        signIn(provider, {
            callbackUrl: window.location.href
        })
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl"
                    >
                        {/* Background with blur and gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl"></div>

                        {/* Content */}
                        <div className="relative p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {authMode === "login" ? "Welcome back" : "Create an account"}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {/* Social login buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/20 text-white bg-white/10 space-x-2"
                                        onClick={() => handleSocialSignIn("google")}
                                        disabled={isLoading}
                                    >
                                        <Chrome className="h-4 w-4" />
                                        <span>Google</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/20 text-white bg-white/10 space-x-2"
                                        onClick={() => handleSocialSignIn("github")}
                                        disabled={isLoading}
                                    >
                                        <Github className="h-4 w-4" />
                                        <span>GitHub</span>
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="px-3 py-1 border border-white/20 text-white bg-white/10 rounded-full">
                                            or continue with email
                                        </span>
                                    </div>
                                </div>

                                {/* Error message display */}
                                {error && (
                                    <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {/* Email/password form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {authMode == "signup" ?
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-300">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ankit Kumar..."
                                                className="bg-gray-800/50 border-white/20 text-white"
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        : " "
                                    }

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-300">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="example@example.com"
                                            className="bg-gray-800/50 border-white/20 text-white"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-300">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-gray-800/50 border-white/20 text-white"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Processing..." : authMode === "login" ? "Sign in" : "Sign up"}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-gray-400">
                                    {authMode === "login" ? (
                                        <>
                                            Don't have an account?{" "}
                                            <button
                                                onClick={() => {
                                                    setAuthMode("signup")
                                                    setError("")
                                                }}
                                                className="text-purple-400 hover:text-purple-300"
                                                disabled={isLoading}
                                            >
                                                Sign up
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Already have an account?{" "}
                                            <button
                                                onClick={() => {
                                                    setAuthMode("login")
                                                    setError("")
                                                }}
                                                className="text-purple-400 hover:text-purple-300"
                                                disabled={isLoading}
                                            >
                                                Sign in
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    )
}