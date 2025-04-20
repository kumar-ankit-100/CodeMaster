// app/api/defaultcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");
    const languageId = searchParams.get("languageId");

    if (!problemId || !languageId) {
      return NextResponse.json(
        { error: "Missing problemId or languageId" },
        { status: 400 }
      );
    }

    // Get the default code from the database
    const defaultCode = await db.defaultCode.findUnique({
      where: {
        problemId_languageId: {
          problemId,
          languageId: parseInt(languageId),
        },
      },
    });

    if (!defaultCode) {
      return NextResponse.json(
        { error: "Default code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: defaultCode.partialBoilerplate });
  } catch (error) {
    console.error("Error fetching default code:", error);
    return NextResponse.json(
      { error: "Failed to fetch default code" },
      { status: 500 }
    );
  }
}