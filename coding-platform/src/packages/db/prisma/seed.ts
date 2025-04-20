// import "dotenv/config"; 
// import { prismaClient } from "../src";
// import { LANGUAGE_MAPPING } from "../../common/language";

// (async () =>
//   await prismaClient.language.createMany({
//     data: Object.keys(LANGUAGE_MAPPING).map((language) => ({
//       id: LANGUAGE_MAPPING[language].internal,
//       name: language,
//       judge0Id: LANGUAGE_MAPPING[language].judge0,
//     })),
//   }))();
import "dotenv/config"; // 👈 Add this line at the top
import { prismaClient } from "../src";
import { LANGUAGE_MAPPING } from "../../common/language";

(async () => {
  try {
    await prismaClient.$connect();
    console.log("✅ Connected to DB");

    await prismaClient.language.createMany({
      data: Object.keys(LANGUAGE_MAPPING).map((language) => ({
        id: LANGUAGE_MAPPING[language].internal,
        name: language,
        judge0Id: LANGUAGE_MAPPING[language].judge0,
      })),
    });

    console.log("✅ Languages inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting languages:", error);
  } finally {
    await prismaClient.$disconnect();
  }
})();
