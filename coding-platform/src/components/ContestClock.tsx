"use client";
import { useEffect, useState } from "react";
import { parseClock } from "@/lib/time";
import { Clock, Lock } from "lucide-react";

export const ContestClock = ({ 
  endTime,
  onTimeUp 
}: { 
  endTime: Date;
  onTimeUp?: () => void;
}) => {
  const [currentTimeLeft, setCurrentTimeLeft] = useState(
    Math.max(0, endTime.getTime() - Date.now())
  );
  const [isTimeUp, setIsTimeUp] = useState(currentTimeLeft <= 0);

  useEffect(() => {
    const updateTimer = () => {
      const newTimeLeft = endTime.getTime() - Date.now();
      setCurrentTimeLeft(Math.max(0, newTimeLeft));
      
      if (newTimeLeft <= 0 && !isTimeUp) {
        setIsTimeUp(true);
        onTimeUp?.();
      }
    };

    // Update immediately
    updateTimer();
    
    // Set up interval if time isn't up yet
    const interval = !isTimeUp ? setInterval(updateTimer, 1000) : undefined;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [endTime, isTimeUp, onTimeUp]);

  return (
    <main className="flex-1 mt-5 md:py-6 rounded-lg shadow-md px-5 md:px-4 bg-gray-800">
      <div className={`flex items-center justify-center ${
        isTimeUp ? 'text-red-500' : 'text-green-500'
      }`}>
        {isTimeUp ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <Clock className="h-4 w-4 text-green-400 mr-2" />
        )}
        {isTimeUp ? (
          <span>Contest Ended</span>
        ) : (
          <div>{parseClock(currentTimeLeft / 1000)}</div>
        )}
      </div>
    </main>
  );
};