"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Save, Award, X, Clock, Maximize, Minimize, CheckIcon, CircleX } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "react-toastify";

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

const LANGUAGE_MAPPING = {
  javascript: { name: "JavaScript", monaco: "javascript", internal: 63 },
  python: { name: "Python", monaco: "python", internal: 71 },
  cpp: { name: "C++", monaco: "cpp", internal: 54 },
};

enum SubmitStatus {
  SUBMIT = "SUBMIT",
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  FAILED = "FAILED",
}

// Mock problem data
const problemData = {
  id: "1",
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
  defaultCode: [
    {
      languageId: 63, // JavaScript
      code: `function twoSum(nums, target) {
  // Your code here
  
}`
    },
    {
      languageId: 71, // Python
      code: `def twoSum(nums, target):
    # Your code here
    pass`
    },
    {
      languageId: 54, // C++
      code: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    
}`
    }
  ],
  slug: "two-sum"
};

export default function CodingPlatform() {
  const router = useRouter();
  const params = useParams();
  const roundId = params?.roundId || "assessment";

  const [code, setCode] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("problem");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT);
  const [testcases, setTestcases] = useState<any[]>([]);
  const monacoRef = useRef(null);

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

    const timer = setTimeout(() => {
      enableFullscreen();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Initialize default code from problem object
  useEffect(() => {
    const defaultCode: { [key: string]: string } = {};
    problemData.defaultCode.forEach((codeEntry) => {
      const language = Object.keys(LANGUAGE_MAPPING).find(
        (lang) => LANGUAGE_MAPPING[lang]?.internal === codeEntry.languageId,
      );
      if (!language) return;
      defaultCode[language] = codeEntry.code;
    });
    setCode(defaultCode);
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

  const handleEditorDidMount = (editor, monaco) => {
    monacoRef.current = editor;

    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCode);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, executeCode);
  };

  const executeCode = async () => {
    setIsExecuting(true);

    setTimeout(() => {
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
    const currentCode = monacoRef.current ? monacoRef.current.getValue() : code[selectedLanguage];
    console.log("Code saved:", currentCode);
  };

  const exitAssessment = () => {
    setTimerRunning(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
    router.push('/all_round');
  };

  async function pollWithBackoff(id: string, retries: number) {
    if (retries === 0) {
      setStatus(SubmitStatus.SUBMIT);
      toast.error("Not able to get status ");
      return;
    }
    const response = await axios.get(`/api/submission/?id=${id}`);
    if (response.data.submission.status === "PENDING") {
      setTestcases(response.data.testCases);
      await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
      pollWithBackoff(id, retries - 1);
    } else {
      if (response.data.submission.status === "AC") {
        setStatus(SubmitStatus.ACCEPTED);
        setTestcases(response.data.testCases);
        toast.success("Accepted!");
        return;
      } else {
        setStatus(SubmitStatus.FAILED);
        toast.error("Failed :(");
        setTestcases(response.data.testCases);
        return;
      }
    }
  }

  async function submit() {
    setStatus(SubmitStatus.PENDING);
    setTestcases(t => t.map(tc => ({...tc, status: "PENDING"})));
    const response = await axios.post(`/api/submission/`, {
      code: code[selectedLanguage],
      languageId: selectedLanguage,
      problemId: problemData.id,
    });
    pollWithBackoff(response.data.id, 10);
  }

  function renderResult(status: string) {
    switch (status) {
      case "AC":
        return <CheckIcon className="h-6 w-6 text-green-500" />;
      case "FAIL":
        return <CircleX className="h-6 w-6 text-red-500" />;
      case "TLE":
        return <Clock className="h-6 w-6 text-red-500" />;
      case "COMPILATION_ERROR":
        return <CircleX className="h-6 w-6 text-red-500" />;
      case "PENDING":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      default:
        return <div className="text-gray-500"></div>;
    }
  }

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

  const SubmissionsPanel = () => (
    <div className="p-6 h-full overflow-auto">
      <div className="grid grid-cols-6 gap-4">
        {testcases.map((testcase, index) => (
          <div key={index} className="border rounded-md border-white/20">
            <div className="px-2 pt-2 flex justify-center text-white">
              <div className="">Test #{index + 1}</div>
            </div>
            <div className="p-2 flex justify-center">
              {renderResult(testcase.status)}
            </div>
          </div>
        ))}
      </div>
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
          <div className="h-full w-full">
            <div className="h-full backdrop-blur-md bg-white/5 overflow-hidden border-r border-white/20">
              <Tabs defaultValue="problem" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-white/20">
                  <TabsList className="bg-gray-800/50">
                    <TabsTrigger value="problem" className="data-[state=active]:bg-purple-600 text-white">
                      Problem
                    </TabsTrigger>
                    <TabsTrigger value="results" className="data-[state=active]:bg-purple-600 text-white">
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="data-[state=active]:bg-purple-600 text-white">
                      Submissions
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
                    <Button 
                      onClick={submit} 
                      disabled={status === SubmitStatus.PENDING}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    >
                      {status === SubmitStatus.PENDING ? "Submitting..." : "Submit"}
                    </Button>
                    <Button onClick={saveCode} variant="outline" className="border-white/20 text-white bg-white/10">
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
                      <div className="border-t md:border-t-0 md:border-l border-white/20 h-full flex flex-col">
                        <div className="flex border-b border-white/20 bg-gray-800">
                          {Object.keys(LANGUAGE_MAPPING).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setSelectedLanguage(lang)}
                              className={`px-4 py-2 text-sm font-medium ${selectedLanguage === lang
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                  : "text-gray-300 hover:bg-gray-700/70"
                                }`}
                            >
                              {LANGUAGE_MAPPING[lang]?.name}
                            </button>
                          ))}
                        </div>
                        <div className="flex-grow">
                          <MonacoEditor
                            height="100%"
                            language={LANGUAGE_MAPPING[selectedLanguage]?.monaco}
                            theme="vs-dark"
                            value={code[selectedLanguage]}
                            onChange={(value) => {
                              setCode({ ...code, [selectedLanguage]: value || '' });
                            }}
                            onMount={handleEditorDidMount}
                            options={{
                              automaticLayout: true,
                              scrollBeyondLastLine: false,
                              minimap: { enabled: true },
                              fontSize: 14,
                              wordWrap: "on",
                              suggestOnTriggerCharacters: true,
                              snippetSuggestions: "on",
                              lineNumbersMinChars: 3,
                              folding: true,
                              renderLineHighlight: "all",
                              scrollbar: {
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10
                              },
                              padding: { top: 16 }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="results" className="p-0 m-0 flex-grow overflow-hidden">
                  <ResultsPanel results={results} isLoading={isExecuting} />
                </TabsContent>

                <TabsContent value="submissions" className="p-0 m-0 flex-grow overflow-hidden">
                  <SubmissionsPanel />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}