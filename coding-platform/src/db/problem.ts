import { db } from ".";
import { Prisma } from "@prisma/client";



export const getProblem = async (problemId: string, contestId?: string) => {
  // if (contestId) {
  //   const contest = await db.contest.findFirst({
  //     where: {
  //       id: contestId,
  //       hidden: false,
  //     },
  //   });

  //   // if (!contest) {
  //   //   return null;
  //   // }

  //   const problem = await db.problem.findFirst({
  //     where: {
  //       id: "cm93vfjii0000fzltqlv5dgvm",
  //       // contests: {
  //       //   some: {
  //       //     contestId: contestId,
  //       //   },
  //       // },
  //     },
  //     // include: {
  //     //   defaultCode: true,
  //     // },
  //   });
  //   return problem;
  // }

  const problem = await db.problem.findFirst({
    where: {
      // id: problemId,
      id:"cm9om6tg3000afzj51cv1scx1", 
    },
    // include: {
    //   defaultCode: true,
    // },
  });
  console.log("Raw problem:", JSON.stringify(problem, null, 2));

  const petsObject = problem?.examples as Prisma.JsonArray;
  // console.log(petsObject[0].input)
  // console.log("Examples:", problem?.examples);
  // console.log("Constraints:", problem?.constraints);


  return problem;
};

export const getProblems = async () => {
  const problems = await db.problem.findMany({
    where: {
      hidden: false,
    },
    include: {
      defaultCode: true,
    },
  });
  return problems;
};
