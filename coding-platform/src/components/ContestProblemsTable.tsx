"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./ui/table";
import { CheckIcon, Lock } from "lucide-react";

interface ProblemRowProps {
  id: string;
  title: string;
  difficulty: string;
  submissionCount: number;
  contestId: string;
  points: number;
  endTime: Date; // Added endTime to props
  sessionId:string;
  
}

export const ContestProblemsTable = ({
  contest,
  sessionId
}: {
  contest: {
    title: string;
    description: string;
    id: string;
    endTime: Date; // Make sure endTime is included in contest object
    problems: {
      problem: {
        id: string;
        title: string;
        difficulty: string;
        solved: number;
      };
    }[];
    contestSubmissions: {
      userId: string;
      problemId: string;
      contestId: string;
      points: number;
    }[];
  },
  sessionId:string
}) => {
  return (
    <div className="flex flex-col">
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{contest.title}</h2>
            </div>
            <div className="backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden rounded-lg shadow-md text-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Problem</TableHead>
                    <TableHead className="text-white">Difficulty</TableHead>
                    <TableHead className="text-white">Your status</TableHead>
                    <TableHead className="text-white">Solve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contest.problems.map(({ problem }) => (
                    <ProblemRow
                      endTime={contest.endTime} // Pass endTime to ProblemRow
                      points={
                        contest.contestSubmissions.find(
                          (submission) => submission.problemId === problem.id,
                        )?.points || 0
                      }
                      contestId={contest.id}
                      key={problem.id}
                      id={problem.id}
                      title={problem.title}
                      difficulty={problem.difficulty}
                      submissionCount={problem.solved}
                      sessionId ={sessionId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function ProblemRow({
  id,
  title,
  difficulty,
  submissionCount,
  contestId,
  points,
  endTime,
  sessionId,
}: ProblemRowProps) {
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

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center justify-between">
          <div className="text-md font-bold">{title}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white-500">
          <span className="font-medium">{difficulty}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white-500">
          <span className="font-medium">
            {points ? <CheckIcon className="h-4 w-4 text-green-500" /> : null}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Link 
          href={isTimeUp ? '#' : `/coding-platform/${contestId}/problem/${id}?sessionId=${sessionId}`}
          onClick={(e) => isTimeUp && e.preventDefault()}
        >
          <Button
            className={`w-full ${
              isTimeUp 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            } text-white shadow-lg shadow-purple-500/20`}
            disabled={isTimeUp}
          >
            {isTimeUp ? (
              <span className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Time's Up
              </span>
            ) : (
              'Solve'
            )}
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}