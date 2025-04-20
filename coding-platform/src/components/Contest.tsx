import { getContest } from "@/db/contest";
import { ContestClock } from "./ContestClock";
// import { ContestPoints } from "./ContestPoints";
import { ContestProblemsTable } from "./ContestProblemsTable";
import PopupCheatDetection from "./PopupCheatDetection";
import Navbar from "./Navbar";
import BehavioralReport from "./BehaviouralReport";

export async function Contest({ id, sessionId}: { id: string ,sessionId:string}) {
  const contest = await getContest(id);

  if (!contest) {
    return <div>Contest not found</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar />
    <div className="grid grid-flow-row-dense gap-4 grid-cols md:grid-cols-12 gap-4 grid-cols-1 min-h-screen px-2 md:px-12">
      <div className="col-span-9">
        <ContestProblemsTable contest={contest} sessionId={sessionId} />
      </div>
      <div className="col-span-3">
        <div className="col-span-3 pt-2 md:pt-24 ">
          <ContestClock endTime={contest.endTime} />
        </div>
        <div className="pt-2">
          {/* <ContestPoints
            points={contest.contestSubmissions.reduce(
              (acc, curr) => acc + curr.points,
              0,
            )}
          /> */}
        </div>

      </div>
      <PopupCheatDetection session_id={sessionId}/>
    </div>
      <BehavioralReport />
    </main>
  );
}
