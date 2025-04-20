"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Lock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Mock progress data
const progressData = [
  { id: "resume", name: "Resume Round", completed: true, locked: false },
  { id: "assessment", name: "Online Assessment", completed: false, locked: false },
  { id: "technical", name: "Technical Screening", completed: false, locked: true },
  { id: "behavioral", name: "Behavioral Round", completed: false, locked: true },
  { id: "hr", name: "HR Round", completed: false, locked: true },
]

export default function ProgressTracker() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartAssessment= async (roundId:string) => {
    router.push(`/FaceMonitoring`);

  }

  return (
    <div className="container mx-auto px-4 ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
      </motion.div>

      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {progressData.map((round, index) => (
          <motion.div
            key={round.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex"
          >
            <div className="flex flex-col relative">
              {/* Circle indicator */}
              <div
                className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${
                  round.completed
                    ? "bg-green-500 text-white"
                    : round.locked
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-600 text-gray-300"
                }`}
              >
                {round.completed ? (
                  <Check className="h-5 w-5" />
                ) : round.locked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Round details */}
              <div className="ml-4 -mt-[36px] pl-6">
                <h3
                  className={`font-semibold ${
                    round.completed ? "text-green-400" : round.locked ? "text-gray-500" : "text-white"
                  }`}
                >
                  {round.name}
                </h3>
                <div className="text-sm">
                  {round.completed ? (
                    <span className="text-green-400">Completed</span>
                  ) : round.locked ? (
                    <span className="text-gray-400">Locked - Complete previous rounds first</span>
                  ) : (
                    <Button 
                      onClick={() => handleStartAssessment(round.id)}
                      disabled={loading}
                      className={`mt-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm py-1 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <div className="w-3 h-3 mr-2 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      {loading ? 'Starting...' : 'Click to continue'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}