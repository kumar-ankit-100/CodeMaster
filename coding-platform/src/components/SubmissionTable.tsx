// /**
//  * v0 by Vercel.
//  * @see https://v0.dev/t/pxkBLMqmzHi
//  * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
//  */
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { CheckIcon, ClockIcon, CircleX } from "lucide-react";
// export interface ISubmission {
//   id: string;
//   time: string;
//   memory: string;
//   problemId: string;
//   languageId: string;
//   code: string;
//   fullCode: string;
//   status: string;
//   testcases: {
//     status: string;
//     index: number;
//   }[];
// }

// function getColor(status: string) {
//   switch (status) {
//     case "AC":
//       return "text-green-500";
//     case "FAIL":
//       return "text-red-500";
//     case "TLE":
//       return "text-red-500";
//     case "COMPILATION_ERROR":
//       return "text-red-500";
//     case "PENDING":
//       return "text-yellow-500";
//     case "REJECTED":
//       return "text-red-500";
//     default:
//       return "text-gray-500";
//   }
// }

// function getIcon(status: string) {
//   switch (status) {
//     case "AC":
//       return <CheckIcon className="h-4 w-4" />;
//     case "FAIL":
//       return <CircleX className="h-4 w-4" />;
//     case "REJECTED":
//       return <CircleX className="h-4 w-4" />;
//     case "TLE":
//       return <ClockIcon className="h-4 w-4" />;
//     case "COMPILATION_ERROR":
//       return <CircleX className="h-4 w-4" />;
//     case "PENDING":
//       return <ClockIcon className="h-4 w-4" />;
//     default:
//       return <ClockIcon className="h-4 w-4" />;
//   }
// }

// export function SubmissionTable({
//   submissions,
// }: {
//   submissions: ISubmission[];
// }) {
//   return (
//     <div className="overflow-x-auto">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Submission ID</TableHead>
//             <TableHead>Result</TableHead>
//             <TableHead>Tests Passed</TableHead>
//             <TableHead>Time</TableHead>
//             <TableHead>Memory</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {submissions.map((submission) => (
//             <TableRow>
//               <TableCell>{submission.id.substr(0, 8)}</TableCell>
//               <TableCell className={getColor(submission.status)}>
//                 {getIcon(submission.status)}
//               </TableCell>
//               <TableCell>
//                 {
//                   submission.testcases.filter(
//                     (testcase) => testcase.status === "AC",
//                   ).length
//                 }
//                 /{submission.testcases.length}
//               </TableCell>
//               <TableCell>{submission.time}</TableCell>
//               <TableCell>{submission.memory}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }


import React from 'react';
import { Check, Clock, XCircle } from 'lucide-react';

export interface ISubmission {
  id: string;
  time: string;
  memory: string;
  problemId: string;
  languageId: string;
  code: string;
  fullCode: string;
  status: string;
  testcases: {
    status: string;
    index: number;
  }[];
}

function getColor(status: string) {
  switch (status) {
    case "AC":
      return "text-green-400";
    case "FAIL":
      return "text-red-400";
    case "TLE":
      return "text-red-400";
    case "COMPILATION_ERROR":
      return "text-red-400";
    case "PENDING":
      return "text-yellow-400";
    case "REJECTED":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

function getIcon(status: string) {
  switch (status) {
    case "AC":
      return <Check className="h-4 w-4" />;
    case "FAIL":
      return <XCircle className="h-4 w-4" />;
    case "REJECTED":
      return <XCircle className="h-4 w-4" />;
    case "TLE":
      return <Clock className="h-4 w-4" />;
    case "COMPILATION_ERROR":
      return <XCircle className="h-4 w-4" />;
    case "PENDING":
      return <Clock className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getBgColor(status: string) {
  return status === "AC" ? "bg-green-900/30 border-green-500/30" : "bg-red-900/30 border-red-500/30";
}

export function SubmissionTable({
  submissions,
  isLoading
}: {
  submissions: ISubmission[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-6 h-full">
        <div className="flex justify-center items-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <span className="ml-3 text-white">Processing submissions...</span>
        </div>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="p-6 h-full">
        <div className="flex justify-center items-center h-full text-gray-400">
          No submissions available
        </div>
      </div>
    );
  }

  return (
    <div className="p-6  overflow-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Submission Results</h3>
      </div>
      <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-gray-700">
        <table className="w-full text-sm text-gray-300">
          <thead className="bg-gray-700/50 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Submission ID</th>
              <th className="px-4 py-3 text-left">Result</th>
              <th className="px-4 py-3 text-left">Tests Passed</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Memory</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                <td className="px-4 py-3 font-mono">{submission.id.substr(0, 8)}</td>
                <td className="px-4 py-3">
                  <div className={`flex items-center ${getColor(submission.status)}`}>
                    {getIcon(submission.status)}
                    <span className="ml-2">{submission.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`px-3 py-1 rounded-full inline-flex items-center justify-center ${submission.testcases.filter(t => t.status === "AC").length === submission.testcases.length ? "bg-green-900/30 border border-green-500/30" : "bg-gray-700/50 border border-gray-600/30"}`}>
                    {submission.testcases.filter(testcase => testcase.status === "AC").length}/{submission.testcases.length}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">{submission.time}</td>
                <td className="px-4 py-3 font-mono">{submission.memory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {submissions.length > 0 && (
        <div className={`mt-6 p-4 rounded-md border ${getBgColor(submissions[0].status)}`}>
          <h3 className={`text-lg font-semibold mb-2 ${getColor(submissions[0].status)}`}>
            {submissions[0].status === "AC" ? "Success!" : "Failed!"}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-400">Execution Time: </span><span className="text-white">{submissions[0].time}</span></div>
            <div><span className="text-gray-400">Memory Used: </span><span className="text-white">{submissions[0].memory}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}