import "dotenv/config"; // 👈 Add this line at the top

import { LANGUAGE_MAPPING } from "@/packages/common/language";
import { prismaClient } from "@/packages/db/src";



interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemData {
  id?: string;
  title: string;
  description: string;
  examples: Example[];
  constraints: string[];
  slug: string;

}


export async function upsertProblemWithTestcases(
  problemDatas: ProblemData,
  inputTestCases: string[],
  outputTestCases: string[],
  fullBoilerplate : object,
  partialBoilerplate : object
) {
    const problemData: ProblemData = typeof problemDatas === "string"
    ? JSON.parse(problemDatas)
    : problemDatas;


    // console.log(problemData,inputTestCases,outputTestCases,fullBoilerplate,partialBoilerplate);
 console.log('aldjflajfjadfkj;laljdf      '+typeof(problemData)+problemData.slug+problemData.title)
    const problem = await prismaClient.problem.upsert({
    where: {
      slug: problemData.slug,
    },
    create: {
      title: problemData.title,
      slug: problemData.slug,
      description: problemData.description,
      examples: problemData.examples ,
      constraints: problemData.constraints,
      outputTestCase : outputTestCases,
      inputTestCase : inputTestCases
    },
    update: {
      title: problemData.title,
      description: problemData.description,
      examples: problemData.examples,
      constraints: problemData.constraints,
      outputTestCase : outputTestCases,
      inputTestCase : inputTestCases
    },
  });

  console.log(`🛠️ Upserted problem in DB: ${problem.slug}`);

  await Promise.all(
    Object.keys(LANGUAGE_MAPPING).map(async (language) => {
      const full = fullBoilerplate[language];
      const partial = partialBoilerplate[language];
  
      if (!full && !partial) {
        console.warn(`⚠️ No boilerplate found for ${language}`);
        return;
      }
  
      await prismaClient.defaultCode.upsert({
        where: {
          problemId_languageId: {
            problemId: problem.id,
            languageId: LANGUAGE_MAPPING[language].internal,
          },
        },
        create: {
          problemId: problem.id,
          languageId: LANGUAGE_MAPPING[language].internal,
          fullBoilerplate: full ?? "",
          partialBoilerplate: partial ?? "",
        },
        update: {
          fullBoilerplate: full ?? "",
          partialBoilerplate: partial ?? "",
        },
      });
  
      console.log(`✅ Upserted full and partial boilerplate for ${language}`);
    })
  );
  
}