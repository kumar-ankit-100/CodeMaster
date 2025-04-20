import { db } from "@/db";
type SUPPORTED_LANGS = "js" | "cpp" ;

interface Problem {
  id: string;
  fullBoilerplateCode: string;
  inputs: string[];
  outputs: string[];
}
const lang_dict = {
  "js":1,
  "cpp":2
}

export const getProblem = async (
    slug: string,
    languageId: SUPPORTED_LANGS,
  ): Promise<Problem> => {
    const problem=await db.problem.findUnique({
          where: {
            slug : slug,
          },
        });
        const defaultCode = await db.defaultCode.findUnique({
      where: {
        problemId_languageId: {
          problemId:problem!.id,
          languageId: parseInt(lang_dict[languageId]),
        },
      },
    });

    


      return {
    id: slug,
    fullBoilerplateCode: defaultCode!.fullBoilerplate,
    inputs: JSON.parse(problem!.inputTestCase),
    outputs: JSON.parse(problem!.outputTestCase),
  };



};
