// File: src/app/api/boilerplate-generator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProblemDefinitionParser } from "./ProblemDefinitionGenerator";
import { FullProblemDefinitionParser } from "./FullProblemDefinitionGenerator";
import { upsertProblemWithTestcases } from "./updateQuestion";

export async function POST(request: Request) {
  try {
    // Parse request body
    const { structureContent ,problemContent ,inputContent , outputContent } = await request.json();
    // console.log(structureContent );
    // console.log(problemContent );
    // console.log(inputContent);
    // console.log(outputContent)


    // Validate input
    if (!structureContent || !problemContent || !inputContent || !outputContent) {
      return NextResponse.json(
        { error: "Structure.md content is required" },
        { status: 400 }
      );
    }
    
    // Generate partial boilerplate
    const partialParser = new ProblemDefinitionParser();
    partialParser.parse(structureContent);
    
    const partialCppCode = partialParser.generateCpp();
    const partialJsCode = partialParser.generateJs();



    // Generate full boilerplate
    const fullParser = new FullProblemDefinitionParser();
    fullParser.parse(structureContent);
    
    const fullCppCode = fullParser.generateCpp();
    const fullJsCode = fullParser.generateJs();
    
    console.log(partialCppCode);
    console.log(fullJsCode);

    // Create response objects with the generated code as strings
    const partialBoilerplate = {
      cpp: partialCppCode,
      js: partialJsCode,
    };
    
    const fullBoilerplate = {
      cpp: fullCppCode,
      js: fullJsCode,
    };
    await upsertProblemWithTestcases(
      problemContent,
      inputContent,
      outputContent,
      fullBoilerplate,
      partialBoilerplate
    );
    // Return the generated code
    return NextResponse.json({
      success: true,
      partialBoilerplate,
      fullBoilerplate,
      message: "Boilerplate code generated successfully"
    });
    
  } catch (error) {
    console.error("Error generating boilerplate:", error);
    return NextResponse.json(
      { error: "Failed to generate boilerplate code", details: error.message },
      { status: 500 }
    );
  }
}

// Modified GET endpoint that returns error since we're no longer storing files
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint no longer stores files. Please use POST to generate code." },
    { status: 400 }
  );
}