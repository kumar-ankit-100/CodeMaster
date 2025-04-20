"use client"

import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, Clock, Cpu, Lightbulb } from "lucide-react"

interface Feedback {
  efficiency: string
  readability: string
  suggestions: string[]
}

interface Results {
  status: "success" | "error"
  output: string
  executionTime: string
  memoryUsed: string
  feedback: Feedback
}

interface ResultsPanelProps {
  results: Results | null
  isLoading: boolean
}

export default function ResultsPanel({ results, isLoading }: ResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">Executing your code...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <p>Run your code to see results</p>
      </div>
    )
  }

  return (
    <div className="p-6 h-[500px] overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          {results.status === "success" ? (
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          )}
          <h3 className="text-xl font-semibold text-white">{results.status === "success" ? "Success!" : "Error"}</h3>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Output:</h4>
          <pre className="font-mono text-green-400 overflow-x-auto">{results.output}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 p-4 rounded-md flex items-center">
            <Clock className="h-5 w-5 text-blue-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-gray-400">Execution Time</h4>
              <p className="text-white font-mono">{results.executionTime}</p>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-md flex items-center">
            <Cpu className="h-5 w-5 text-purple-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-gray-400">Memory Used</h4>
              <p className="text-white font-mono">{results.memoryUsed}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
          AI Feedback
        </h3>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-gray-800/50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Efficiency</h4>
            <p className="text-white">{results.feedback.efficiency}</p>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Readability</h4>
            <p className="text-white">{results.feedback.readability}</p>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Suggestions</h4>
            <ul className="list-disc pl-5 text-white">
              {results.feedback.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

