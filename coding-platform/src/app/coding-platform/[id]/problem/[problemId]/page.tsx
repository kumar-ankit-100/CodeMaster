import { CodingPlatform } from "@/components/A";
import { getProblem } from "../../../../../db/problem";
import { getContest } from "@/db/contest";

export default async function ProblemPage({
  params: { id, problemId },
  searchParams
}: {
  params: {
    id: string;
    problemId: string;
  };
  searchParams: { sessionId?: string };
}) {
  const sessionId = searchParams.sessionId ?? '';
  console.log(problemId)

  const problem = await getProblem(problemId , id);
  const contest = await getContest(id);
  
  
  

  if (!problem) {
    return <div>Problem not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      
        <CodingPlatform contestId={id} problem={problem} endTime = {contest?.endTime} sessionId={sessionId} />
    </div>
  );
}
export const dynamic = "force-dynamic";
