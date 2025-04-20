"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, ClockIcon, Play, Save, Award, X, Clock, Maximize, Minimize, CheckIcon, CircleX } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { db } from "@/db";

import PopupCheatDetection from "./PopupCheatDetection";

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
import { ISubmission, SubmissionTable } from "@/components/SubmissionTable";
import { LANGUAGE_MAPPING } from "@/packages/common/language";
import { updateProblemContest } from "@/db/problem";
import { ContestClock } from "./ContestClock";




enum SubmitStatus {
  SUBMIT = "SUBMIT",
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  FAILED = "FAILED",
}


export const CodingPlatform = ({
  problem,
  contestId,
  endTime,
  sessionId
}: {
  problem: IProblem;
  contestId?: string;
  endTime: Date;
  sessionId: string;
}) => {
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
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/'); // fallback
    }
  };







  const ProblemStatement = ({ problem }) => (
    console.log(problem),
    <div className="p-6 overflow-auto h-full">
      <h2 className="text-2xl font-bold text-white mb-4">{problem.title}</h2>
      <p className="text-gray-300 mb-6">{problem.description}</p>

      <h3 className="text-lg font-semibold text-white mb-2">Examples:</h3>
      {problem.examples.map((examples, i) => (
        <div key={i} className="mb-4 bg-gray-800/50 p-4 rounded-md">
          <div className="mb-1"><span className="text-purple-400">Input:</span> <span className="text-gray-300">{examples.input}</span></div>
          <div className="mb-1"><span className="text-purple-400">Output:</span> <span className="text-gray-300">{examples.output}</span></div>
          {examples.explanation && (
            <div><span className="text-purple-400">Explanation:</span> <span className="text-gray-300">{examples.explanation}</span></div>
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



  return (
    <div className="min-h-screen flex flex-col bg-gray-900 overflow-auto">
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
            Exit Problem
          </Button>
          <span className="text-gray-300 ml-4">{roundTitle}</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="rounded-md -mt-9 ">
            <ContestClock

              endTime={endTime} />
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
                    
                    <TabsTrigger value="submissions" className="data-[state=active]:bg-purple-600 text-white">
                      Submissions
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                   
                    <Button onClick={saveCode} variant="outline" className="border-white/20 text-white bg-white/10">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>

                <TabsContent value="problem" className="p-0 m-0 flex-grow overflow-hidden">
                  <div className="h-full grid grid-cols-1 md:grid-cols-2">
                    <div className="overflow-auto">
                      <ProblemStatement problem={problem} />
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-white/20 h-full">
                      <div className="border-t md:border-t-0 md:border-l border-white/20 h-full flex flex-col">

                        <div className="flex-grow">
                          <SubmitProblem problem={problem} contestId={contestId} endTime={endTime} />

                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>


                <TabsContent value="submissions" className="p-0 m-0 flex-grow overflow-hidden">
                  {activeTab === "submissions" && <Submissions problem={problem} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <PopupCheatDetection session_id={sessionId} />
    </div>
  );
}

















export interface IProblem {
  id: string;
  title: string;
  description: string;
  slug: string;
  defaultCode: {
    languageId: number;
    code: string;
  }[];
}


function Submissions({ problem }: { problem: IProblem }) {
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        `/api/submission/bulk?problemId=${problem.id}`,
      );
      setSubmissions(response.data.submissions || []);
    };
    fetchData();
  }, []);
  return (
    <div>
      <SubmissionTable submissions={submissions} />
    </div>
  );
}

function SubmitProblem({
  problem,
  contestId,
  endTime,
}: {
  problem: IProblem;
  contestId?: string;
  endTime: Date,
}) {
  const [language, setLanguage] = useState(
    Object.keys(LANGUAGE_MAPPING)[0] as string,
  );
  const [code, setCode] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT);
  const [testcases, setTestcases] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      setIsTimeUp(now >= endTime);
    };

    // Check immediately
    checkTime();

    // Set up interval to check every second
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, [endTime]);


  // Fetch default code when language changes or on component mount
  useEffect(() => {
    const fetchDefaultCode = async () => {
      try {
        // Get the internal language ID from LANGUAGE_MAPPING
        const internalLanguageId = LANGUAGE_MAPPING[language]?.internal;
        if (!internalLanguageId) return;

        // Check if we already have the code for this language in state
        if (code[language]) return;

        // Try to fetch from the API
        const response = await axios.get(`/api/defaultcode?problemId=${problem.id}&languageId=${internalLanguageId}`);

        if (response.data.code) {
          setCode(prevCode => ({
            ...prevCode,
            [language]: response.data.code
          }));
        }
      } catch (error) {
        // If fetching fails, fall back to the default code from the problem object
        if (!problem.defaultCode) return;

        const defaultCodeEntry = problem.defaultCode.find(
          codeEntry => codeEntry.languageId === LANGUAGE_MAPPING[language]?.internal
        );

        if (defaultCodeEntry) {
          setCode(prevCode => ({
            ...prevCode,
            [language]: defaultCodeEntry.code
          }));
        }
      }
    };

    fetchDefaultCode();
  }, [language, problem.id]);

  // Initialize default code from problem object
  useEffect(() => {
    if (!problem.defaultCode) return;
    const defaultCode: { [key: string]: string } = {};
    problem.defaultCode.forEach((code) => {
      const language = Object.keys(LANGUAGE_MAPPING).find(
        (language) => LANGUAGE_MAPPING[language]?.internal === code.languageId,
      );
      if (!language) return;
      defaultCode[language] = code.code;
    });
    setCode(defaultCode);
  }, [problem]);

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
        const contestId = response.data.submission.activeContestId;
        const problemId = response.data.submission.problemId;
        await fetch('/api/contest-problem-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contestId, problemId }),
        });

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
    setTestcases(t => t.map(tc => ({ ...tc, status: "PENDING" })));
    const response = await axios.post(`/api/submission/`, {
      code: code[language],
      languageId: language,
      problemId: problem.id,
      activeContestId: contestId,
    });
    pollWithBackoff(response.data.id, 10);
  }

  return (
    <div>
        <div className="flex items-center justify-between border-b border-white/20 bg-gray-800 px-4 py-2">
    {/* Left: Language Tabs */}
    <div className="flex">
      {Object.keys(LANGUAGE_MAPPING).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-4 py-2 text-sm font-medium ${
            language === lang
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              : "text-gray-300 hover:bg-gray-700/70"
          }`}
        >
          {LANGUAGE_MAPPING[lang]?.name}
        </button>
      ))}
    </div>

    {/* Right: Run Code Button */}
    <div>
      <Button
        disabled={status === SubmitStatus.PENDING || isTimeUp}
        type="submit"
        className={`${
          isTimeUp
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        } text-white shadow-lg shadow-purple-500/20`}
        onClick={submit}
      >
        {isTimeUp ? (
          <span className="flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            Time's Up
          </span>
        ) : status === SubmitStatus.PENDING ? (
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
    </div>
  </div>

      <div className="pt-4 rounded-md">
        <Editor
          height={"60vh"}
          value={code[language]}
          theme="vs-dark"
          onMount={() => { }}
          options={{
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
          language={LANGUAGE_MAPPING[language]?.monaco}
          onChange={(value) => {
            //@ts-ignore
            setCode({ ...code, [language]: value });
          }}
          defaultLanguage="javascript"
        />
      </div>

      <RenderTestcase testcases={testcases} />
    </div>
  );
}

function renderResult(status: string) {
  switch (status) {
    case "AC":
      return <CheckIcon className="h-6 w-6 text-green-500" />;
    case "FAIL":
      return <CircleX className="h-6 w-6 text-red-500" />;
    case "TLE":
      return <ClockIcon className="h-6 w-6 text-red-500" />;
    case "COMPILATION_ERROR":
      return <CircleX className="h-6 w-6 text-red-500" />;
    case "PENDING":
      return <ClockIcon className="h-6 w-6 text-yellow-500" />;
    default:
      return <div className="text-gray-500"></div>;
  }
}

function RenderTestcase({ testcases }: { testcases: any[] }) {
  return (
    <div className="grid grid-cols-6 gap-4 mt-4 mb-4 ml-10">
      {testcases.map((testcase, index) => (
        <div key={index} className="border rounded-md">
          <div className="px-2 pt-2 flex justify-center text-white">
            <div className="">Test #{index + 1}</div>
          </div>
          <div className="p-2 flex justify-center">
            {renderResult(testcase.status)}
          </div>
        </div>
      ))}
    </div>
  );
}

