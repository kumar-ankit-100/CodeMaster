import "dotenv/config"; // 👈 Add this line at the top

import { LANGUAGE_MAPPING } from "../../common/language";
import fs from "fs";
import path from "path";
import { prismaClient } from "../src";

// Make sure the full absolute path is correctly resolved
const MOUNT_PATH = path.resolve(__dirname, "../../../helper/problems");
console.log("📂 MOUNT_PATH resolved to:", MOUNT_PATH);

function promisifedReadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("❌ Error reading file:", filePath);
        console.error(err);
        reject(err);
      }
      resolve(data);
    });
  });
}

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


async function main(problemSlug: string, problemTitle: string) {
  // const problemMarkdownPath = `${MOUNT_PATH}/${problemSlug}/Problem.md`;
  // console.log(`📄 Reading Problem.md for ${problemSlug} from ${problemMarkdownPath}`);

  // const problemStatement = await promisifedReadFile(problemMarkdownPath);
  // console.log(`✅ Loaded Problem.md content for ${problemSlug}`);

  // const problem = await prismaClient.problem.upsert({
  //   where: {
  //     slug: problemSlug,
  //   },
  //   create: {
  //     title: problemSlug,
  //     slug: problemSlug,
  //     description: problemStatement,
  //   },
  //   update: {
  //     description: problemStatement,
  //   },
  // });

  // console.log(`🛠️ Upserted problem in DB: ${problem.slug}`);


  const problemJsonPath = `${MOUNT_PATH}/${problemSlug}/problem.json`;
  console.log(`📄 Reading problem.json for ${problemSlug} from ${problemJsonPath}`);

  const problemJson = await promisifedReadFile(problemJsonPath);
  const problemData: ProblemData = JSON.parse(problemJson);
  console.log('🔄 Parsed problem data:', problemData);

  const problem = await prismaClient.problem.upsert({
    where: {
      slug: problemSlug,
    },
    create: {
      title: problemData.title,
      slug: problemData.slug,
      description: problemData.description,
      examples: problemData.examples,
      constraints: problemData.constraints,
    },
    update: {
      title: problemData.title,
      description: problemData.description,
      examples: problemData.examples,
      constraints: problemData.constraints,
    },
  });

  console.log(`🛠️ Upserted problem in DB: ${problem.slug}`);

  await Promise.all(
    Object.keys(LANGUAGE_MAPPING).map(async (language) => {
      const boilerplatePath = `${MOUNT_PATH}/${problemSlug}/boilerplate/function.${language}`;
      console.log(`📦 Reading boilerplate for ${language} from ${boilerplatePath}`);

      const code = await promisifedReadFile(boilerplatePath);
      console.log(`✅ Boilerplate loaded for ${language}`);

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
          code,
        },
        update: {
          code,
        },
      });

      console.log(`🧠 Upserted default code for ${language}`);
    }),
  );
}

const problems = [
  { slug: "classroom", title: "Classroom Problem" },
  // { slug: "two-sum", title: "Two Sum" },
  // { slug: "max-element", title: "Max Element Problem" },
];

(async () => {
  for (const { slug, title } of problems) {
    try {
      console.log(`\n🚀 Seeding problem: ${title}`);
      await main(slug, title);
      console.log(`✅ Seeded: ${title}`);
    } catch (err) {
      console.error(`❌ Failed to seed: ${title}`);
      console.error(err);
    }
  }
})();
