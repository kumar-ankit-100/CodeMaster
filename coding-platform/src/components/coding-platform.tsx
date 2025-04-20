"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Save, Award, X, Clock, Maximize, Minimize } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// Mock problem data
const problemData = {
  title: "Two Sum",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  defaultCode: `function twoSum(nums, target) {
  // Your code here
  
}`,
}

// Mock leaderboard data
const leaderboardData = [
  { rank: 1, name: "Alex Johnson", score: 98, time: "12:45" },
  { rank: 2, name: "Maya Patel", score: 95, time: "14:22" },
  { rank: 3, name: "Sam Wilson", score: 89, time: "15:01" },
  { rank: 4, name: "Taylor Kim", score: 87, time: "13:37" },
  { rank: 5, name: "Jordan Lee", score: 85, time: "17:50" },
]

export default function CodingPlatform() {
  const router = useRouter();
  const params = useParams();
  const roundId = params?.roundId || "assessment";
  
  const [code, setCode] = useState(problemData.defaultCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("problem");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true); // Start timer automatically
  
  // Set title based on round ID
  const roundTitle = 
    roundId === "assessment" ? "Online Assessment" :
    roundId === "technical" ? "Technical Screening" : "Coding Challenge";

  // Handle timer
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Auto-enable fullscreen on mount
  useEffect(() => {
    const enableFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      }
    };
    
    // Enable fullscreen after a short delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      enableFullscreen();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const executeCode = async () => {
    setIsExecuting(true);

    // Simulate code execution with a delay
    setTimeout(() => {
      // Mock results
      setResults({
        status: "success",
        output: "[0, 1]",
        executionTime: "12ms",
        memoryUsed: "4.2MB",
        feedback: {
          efficiency: "Good",
          readability: "Excellent",
          suggestions: ["Consider using a hash map to improve time complexity from O(n²) to O(n)"],
        },
      });
      setIsExecuting(false);
      setActiveTab("results");
    }, 1500);
  };

  const saveCode = () => {
    // Mock save functionality
    console.log("Code saved:", code);
    // Here you would typically send the code to your backend
  };

  const exitAssessment = () => {
    // Stop timer
    setTimerRunning(false);
    
    // Exit fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
    
    // Navigate back to progress tracker
    router.push('/progress');
  };

  // Simple component implementations
  const CodeEditor = ({ code, setCode }) => (
    <div className="h-full bg-gray-900 p-4 overflow-auto">
      <textarea 
        className="w-full h-full bg-gray-900 text-green-400 font-mono p-2 focus:outline-none resize-none border border-gray-700 rounded"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
    </div>
  );

  const ProblemStatement = ({ problem }) => (
    <div className="p-6 overflow-auto h-full">
      <h2 className="text-2xl font-bold text-white mb-4">{problem.title}</h2>
      <p className="text-gray-300 mb-6">{problem.description}</p>
      
      <h3 className="text-lg font-semibold text-white mb-2">Examples:</h3>
      {problem.examples.map((example, i) => (
        <div key={i} className="mb-4 bg-gray-800/50 p-4 rounded-md">
          <div className="mb-1"><span className="text-purple-400">Input:</span> <span className="text-gray-300">{example.input}</span></div>
          <div className="mb-1"><span className="text-purple-400">Output:</span> <span className="text-gray-300">{example.output}</span></div>
          {example.explanation && (
            <div><span className="text-purple-400">Explanation:</span> <span className="text-gray-300">{example.explanation}</span></div>
          )}
        </div>
      ))}
      
      <h3 className="text-lg font-semibold text-white mb-2">Constraints:</h3>
      <ul className="list-disc pl-5 text-gray-300">
        {problem.constraints.map((constraint, i) => (
          <li key={i} className="mb-1">{constraint}</li>
        ))}
      </ul>
    </div>
  );

  const ResultsPanel = ({ results, isLoading }) => (
    <div className="p-6 h-full overflow-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <span className="ml-3 text-white">Executing your code...</span>
        </div>
      ) : results ? (
        <div>
          <div className={`mb-6 p-4 rounded-md ${results.status === 'success' ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${results.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {results.status === 'success' ? 'Success!' : 'Failed!'}
            </h3>
            <div className="mb-2">
              <span className="text-gray-400">Output: </span>
              <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded">{results.output}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">Execution Time: </span><span className="text-white">{results.executionTime}</span></div>
              <div><span className="text-gray-400">Memory Used: </span><span className="text-white">{results.memoryUsed}</span></div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Performance Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-md">
                <h4 className="text-purple-400 mb-1">Efficiency</h4>
                <div className="text-gray-300">{results.feedback.efficiency}</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-md">
                <h4 className="text-purple-400 mb-1">Readability</h4>
                <div className="text-gray-300">{results.feedback.readability}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Suggestions</h3>
            <ul className="list-disc pl-5 text-gray-300">
              {results.feedback.suggestions.map((suggestion, i) => (
                <li key={i} className="mb-1">{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full text-gray-400">
          Run your code to see results here
        </div>
      )}
    </div>
  );

  const Leaderboard = () => (
    <div className="p-4">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/20">
            <th className="pb-2 text-gray-400">Rank</th>
            <th className="pb-2 text-gray-400">Name</th>
            <th className="pb-2 text-gray-400">Score</th>
            <th className="pb-2 text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry) => (
            <tr key={entry.rank} className="border-b border-white/10">
              <td className="py-3 px-1">
                {entry.rank <= 3 ? (
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    entry.rank === 1 ? "bg-yellow-500" : entry.rank === 2 ? "bg-gray-400" : "bg-amber-700"
                  } text-black font-bold text-xs`}>
                    {entry.rank}
                  </span>
                ) : (
                  <span className="text-gray-400 pl-2">{entry.rank}</span>
                )}
              </td>
              <td className="py-3 text-white">{entry.name}</td>
              <td className="py-3 text-green-400">{entry.score}</td>
              <td className="py-3 text-gray-300">{entry.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
      {/* Header with timer and controls */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-white/20">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={exitAssessment}
            className="text-gray-300 hover:text-white"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Assessment
          </Button>
          <span className="text-gray-300 ml-4">{roundTitle}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-700 rounded-md px-3 py-1">
            <Clock className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-green-400 font-mono">{formatTime(timer)}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Coding platform */}
      <div className="flex-grow overflow-hidden">
        <div className="h-full">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-0">
            <div className="lg:col-span-2 h-full">
              <div className="h-full backdrop-blur-md bg-white/5 overflow-hidden border-r border-white/20">
                <Tabs defaultValue="problem" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-white/20">
                    <TabsList className="bg-gray-800/50">
                      <TabsTrigger value="problem" className="data-[state=active]:bg-purple-600">
                        Problem
                      </TabsTrigger>
                      <TabsTrigger value="results" className="data-[state=active]:bg-purple-600">
                        Results
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <Button
                        onClick={executeCode}
                        disabled={isExecuting}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20"
                      >
                        {isExecuting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Run Code
                          </>
                        )}
                      </Button>
                      <Button onClick={saveCode} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="problem" className="p-0 m-0 flex-grow overflow-hidden">
                    <div className="h-full grid grid-cols-1 md:grid-cols-2">
                      <div className="overflow-auto">
                        <ProblemStatement problem={problemData} />
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-white/20 h-full">
                        <CodeEditor code={code} setCode={setCode} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="p-0 m-0 flex-grow overflow-hidden">
                    <ResultsPanel results={results} isLoading={isExecuting} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="lg:col-span-1 h-full overflow-hidden">
              <div className="h-full backdrop-blur-md bg-white/5 overflow-hidden border-l border-white/20">
                <div className="p-4 border-b border-white/20 flex items-center">
                  <Award className="h-5 w-5 text-yellow-400 mr-2" />
                  <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
                </div>
                <div className="overflow-auto h-[calc(100%-56px)]">
                  <Leaderboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interview features panel (only for technical round) */}
      {roundId === 'technical' && (
        <div className="bg-gray-800 border-t border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">Technical Interview Features</h3>
            <div className="flex space-x-3">
              <Button size="sm" className="bg-gray-700 text-white hover:bg-gray-600">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                Record Session
              </Button>
              <Button size="sm" className="bg-gray-700 text-white hover:bg-gray-600">
                Share Screen
              </Button>
              <Button size="sm" className="bg-gray-700 text-white hover:bg-gray-600">
                Whiteboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}