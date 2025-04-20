"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSession, signOut } from "next-auth/react"
import { ChevronDown, ChevronUp, FileText, LogOut, Code, Terminal, Check, Lock, Play, CodeSquare, Users, Layers, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AuthDialog from "./auth_dialog"
import ProgressTracker from "./progress_traker" // Importing your progress tracker component

export default function AddPageContent() {
  const { data: session, status } = useSession()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState("resume")
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const handleParticipate = () => {
    if (status !== "authenticated") {
      setIsAuthOpen(true)
    } else {
      // Handle participation logic
      console.log(`Participating in ${selectedRound} round`)
    }
  }

  const handleGenerateReport = () => {
    if (status !== "authenticated") {
      setIsAuthOpen(true)
    } else {
      // Handle report generation logic
      console.log("Generating full report")
    }
  }

  const handleLogin = () => {
    setIsAuthOpen(false)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Round icons mapping
  const roundIcons = {
    resume: <FileText className="h-5 w-5" />,
    assessment: <Layers className="h-5 w-5" />,
    technical: <CodeSquare className="h-5 w-5" />,
    behavioral: <Users className="h-5 w-5" />,
    hr: <Database className="h-5 w-5" />
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Authentication Status */}
      <motion.header 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              &lt;Interview/&gt;
            </span> Preparation
          </h1>
          <div className="flex items-center mt-2">
            <code className="text-gray-300 bg-gray-800/70 px-3 py-1 rounded font-mono text-sm inline-flex items-center">
              <Terminal className="h-4 w-4 mr-2 text-green-400" />
              <span className="typing-animation">./master_your_tech_interviews.sh</span>
            </code>
          </div>
        </div>

      
      </motion.header>

      {/* Main content with Progress Tracker and Round Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Part 1: Progress Tracker */}
          <Card className="backdrop-blur-md bg-gray-900/80 border border-gray-700/50 overflow-hidden shadow-xl shadow-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 mr-3"></div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Code className="mr-2 text-blue-400" />
                  {status === "authenticated" ? "Your Progress" : "Progress Tracker"}
                  <span className="text-blue-400 ml-1 font-mono animate-pulse">_</span>
                </h2>
              </div>
              
              {status === "authenticated" ? (
                <div className="relative">
                  <div className="pl-8">
                    <ProgressTracker />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/80 p-6 rounded-lg text-center border border-dashed border-gray-700">
                  <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="font-mono text-gray-300 mb-4">
                    <p className="text-green-400">$ progress --track</p>
                    <p className="text-red-400">Error: Authentication required</p>
                    <p className="text-amber-400">Hint: Run login.js first</p>
                  </div>
                  <Button 
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-mono border border-gray-600"
                  >
                    npm run auth --login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Part 2: Round Selection & Report Generation */}
          <Card className="backdrop-blur-md bg-gray-900/80 border border-gray-700/50 overflow-hidden shadow-xl shadow-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 mr-3"></div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <CodeSquare className="mr-2 text-purple-400" />
                  Select Round
                  <span className="text-purple-400 ml-1 font-mono animate-pulse">_</span>
                </h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-mono flex items-center">
                    <span className="text-green-400">// </span>
                    Choose Interview Round
                  </label>
                  <Select value={selectedRound} onValueChange={setSelectedRound}>
                    <SelectTrigger className="bg-gray-800/80 border-gray-700 text-white font-mono">
                      <SelectValue placeholder="Select a round" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem className="flex items-center" value="resume">
                        <div className="flex items-center">
                          {roundIcons.resume}
                          <span className="ml-2">Resume Round</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="assessment">
                        <div className="flex items-center">
                          {roundIcons.assessment}
                          <span className="ml-2">Online Assessment</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="technical">
                        <div className="flex items-center">
                          {roundIcons.technical}
                          <span className="ml-2">Technical Screening</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="behavioral">
                        <div className="flex items-center">
                          {roundIcons.behavioral}
                          <span className="ml-2">Behavioral Round</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hr">
                        <div className="flex items-center">
                          {roundIcons.hr}
                          <span className="ml-2">HR Round</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-gray-800/60 border border-gray-700/80">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-700/70">
                        {roundIcons[selectedRound as keyof typeof roundIcons]}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {selectedRound === "resume" ? "Resume Round" : 
                           selectedRound === "assessment" ? "Online Assessment" :
                           selectedRound === "technical" ? "Technical Screening" :
                           selectedRound === "behavioral" ? "Behavioral Round" : "HR Round"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {selectedRound === "resume" ? "Optimize your resume for ATS systems" : 
                           selectedRound === "assessment" ? "Complete coding challenges" :
                           selectedRound === "technical" ? "Answer technical questions" :
                           selectedRound === "behavioral" ? "STAR method responses" : "Final interview preparation"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={handleParticipate}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/20 py-6 relative overflow-hidden group"
                  >
                    
                    <span className="group-hover:opacity-80 transition-opacity flex items-center">
                      <Play className="mr-2 h-4 w-4" />
                      {status === "authenticated" ? "Participate in this Round" : "Sign in to Participate"}
                    </span>
                  </Button>

                  <Button
                    onClick={handleGenerateReport}
                    variant="outline"
                    className="border-gray-700 text-white bg-gray-800/60 hover:bg-gray-700/60 py-5 group"
                  >
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 group-hover:text-green-400 transition-colors" />
                      <span className="font-mono group-hover:text-green-400 transition-colors">Generate Report.pdf</span>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Authentication Dialog */}
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
      
      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .typing-animation::after {
          content: '|';
          display: inline-block;
          margin-left: 4px;
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  )
}