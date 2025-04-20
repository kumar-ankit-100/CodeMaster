// app/api/interview/session/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { act } from 'react';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { roundId , InterviewSessionId } = await request.json();
    
    // Check if there's an active interview contest for this user
    const now = new Date();
    const activeContest = await prisma.contest.findFirst({
      where: {
        // Find contests where:
        // 1. There are submissions from this user
        userId : userId,
        // 2. The contest hasn't ended yet
        endTime: {
          gt: now
        },
        // 3. Add title pattern to ensure it's an interview contest
        title: {
          startsWith: "Interview: "
        }
      },
      include: {
        problems: {
          include: {
            problem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(activeContest + "i am in active contest")
    
    if (activeContest) {
      // Return existing contest with problem information
      return NextResponse.json({
        contestId: activeContest.id,
        InterviewSessionId : activeContest.interviewSessionId,
        message: 'Continuing existing interview session',
        isNew: false,
        problemCount: activeContest.problems.length,
        problems: activeContest.problems.map(cp => ({
          index: cp.index,
          title: cp.problem.title,
          slug: cp.problem.slug
        })),
        endTime: activeContest.endTime // Return end time for timer
      });
    }
    
    // No active contest, create a new one
    // Set duration based on round type (could be configurable)
    let durationMinutes = 60; // Default 1 hour
    
    if (roundId === 'assessment') {
      durationMinutes = 60; // 1.5 hours for assessment
    } else if (roundId === 'technical') {
      durationMinutes = 120; // 2 hours for technical
    }
    
    const startTime = now;
    const endTime = new Date(now.getTime() + durationMinutes * 60000);
    
    // Select problems based on round type
    let problemSlugs = ["classroom", "two-sum"]; // Default problems
    
    // Customize problems based on round type
    if (roundId === 'assessment') {
      problemSlugs = ["classroom", "two-sum"]; // Assessment problems
    } else if (roundId === 'technical') {
      problemSlugs = ["classroom", "two-sum"]; // Technical problems
      // In a real scenario, you'd have different problems for different rounds
    }
    
    // Fetch the problems by slug
    const problems = await prisma.problem.findMany({
      where: {
        slug: {
          in: problemSlugs
        }
      }
    });
    
    if (problems.length === 0) {
      return NextResponse.json(
        { message: 'No problems found for this interview session' },
        { status: 404 }
      );
    }
    
    // First create the contest
    console.log(userId)
    const newContest = await prisma.contest.create({
      data: {
        title: `Interview: ${roundId.charAt(0).toUpperCase() + roundId.slice(1)} Round`,
        description: `This is an automated interview session for the ${roundId} round.`,
        startTime: startTime,
        endTime: endTime,
        hidden: false, // Make visible to the user
        leaderboard: false, // No leaderboard for interviews
        userId: userId,
        interviewSessionId : InterviewSessionId,
      }
    });
    
    // Then add problems to the contest separately
    const contestProblems = [];
    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      const contestProblem = await prisma.contestProblem.create({
        data: {
          id: `${newContest.id}-${problem.id}`, // Custom ID format
          contestId: newContest.id, // This part of compound primary key
          problemId: problem.id,    // This part of compound primary key
          index: i + 1,
          solved: 0
        },
        include: {
          problem: true
        }
      });
      contestProblems.push(contestProblem);
    }
    
    // Return the full contest with problems
    const contestWithProblems = {
      ...newContest,
      problems: contestProblems
    };
    
    // Return the new contest ID and problem information
    return NextResponse.json({
      contestId: contestWithProblems.id,
      message: 'New interview session created',
      isNew: true,
      problemCount: contestProblems.length,
      problems: contestProblems.map(cp => ({
        index: cp.index,
        title: cp.problem.title,
        slug: cp.problem.slug
      })),
      endTime: contestWithProblems.endTime // Return end time for timer
    });
    
  } catch (error) {
    console.error('Error managing interview session:', error);
    return NextResponse.json(
      { message: 'Failed to start interview session', error: error.message },
      { status: 500 }
    );
  }
}