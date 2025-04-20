"use client";

import CheatDetection from '@/components/CheatDetection';

export default function Home() {


  return (
    <div className="flex flex-col gap-8">
      <CheatDetection
        apiUrl="http://localhost:8000"
        userId="test_user_123"
        userName="Test User"
        userEmail="test@example.com"
        onCheatDetected={(result) => console.log('Cheating detected:', result)}
        onError={(error) => console.error('Error:', error)}
        onStatusChange={(status) => console.log('Status:', status)}
      />


    </div>


  );
}