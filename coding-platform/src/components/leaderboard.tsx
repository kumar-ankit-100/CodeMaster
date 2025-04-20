"use client"

import { motion } from "framer-motion"
import { User, Clock, Award } from "lucide-react"

// Mock leaderboard data
const leaderboardData = [
  { id: 1, name: "Alex Johnson", time: "10ms", memory: "3.8MB", score: 98 },
  { id: 2, name: "Sarah Chen", time: "12ms", memory: "4.1MB", score: 95 },
  { id: 3, name: "Miguel Rodriguez", time: "15ms", memory: "4.0MB", score: 92 },
  { id: 4, name: "Emma Wilson", time: "18ms", memory: "4.2MB", score: 89 },
  { id: 5, name: "Raj Patel", time: "20ms", memory: "4.5MB", score: 86 },
  { id: 6, name: "Lisa Kim", time: "22ms", memory: "4.3MB", score: 84 },
  { id: 7, name: "David Thompson", time: "25ms", memory: "4.7MB", score: 81 },
]

export default function Leaderboard() {
  return (
    <div className="p-4">
      <div className="overflow-y-auto max-h-[450px]">
        {leaderboardData.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`mb-3 p-3 rounded-lg ${
              index === 0
                ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30"
                : index === 1
                  ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30"
                  : index === 2
                    ? "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30"
                    : "bg-gray-800/30 border border-white/10"
            }`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  index === 0
                    ? "bg-yellow-500/30 text-yellow-300"
                    : index === 1
                      ? "bg-gray-400/30 text-gray-300"
                      : index === 2
                        ? "bg-amber-600/30 text-amber-300"
                        : "bg-gray-700/50 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-white font-medium">{entry.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{entry.score}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
            <div className="flex text-xs text-gray-400">
              <div className="flex items-center mr-3">
                <Clock className="h-3 w-3 mr-1" />
                {entry.time}
              </div>
              <div className="flex items-center">
                <Award className="h-3 w-3 mr-1" />
                {entry.memory}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

