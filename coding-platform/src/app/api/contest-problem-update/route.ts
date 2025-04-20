// app/api/contest-problem/route.ts
import { NextResponse } from 'next/server';
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const { contestId, problemId } = await request.json();
    
    if (!contestId || !problemId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    const result = await db.contestProblem.update({
      where: {
        contestId_problemId: {
          contestId: contestId,
          problemId: problemId
        }
      },
      data: {
        solved: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to update problem solved status:", error);
    return NextResponse.json(
      { error: "Failed to update problem" },
      { status: 500 }
    );
  }
}