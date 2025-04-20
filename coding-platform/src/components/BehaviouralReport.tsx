"use client";


import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Define the shape of the behavior data
interface BehaviorData {
  currentFocused: number;
  attentionScore: number;
  suspicionLevel: string;
  timestamp: string;
  gazeDeviationPercent: number;
  cheatProbability: number;
}

export default function BehavioralReport(): JSX.Element {
  const [behaviorData, setBehaviorData] = useState<BehaviorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState<boolean>(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 5;
    const initialRetryDelay = 1000;

    const fetchData = async (): Promise<void> => {
      try {
        // Simulate a real API call with a delay
        const response = await fetch(`http://localhost:8000/get_behavior_data`);
        if (!response.ok) throw new Error('Failed to fetch behavior data');
        
        // Get the full response object
        const responseData = await response.json();
        
        // Extract the actual data array from the response
        const data: BehaviorData[] = responseData.data;
    
        setBehaviorData(prevData => {
          if (data.length > 0) return data;
          return prevData;
        });
        console.log(data)
        
        // Reset states
        retryCount = 0;
        setError(null);
        setLoading(false);
      } catch (err: unknown) {
        // Implement exponential backoff for retries
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = initialRetryDelay * Math.pow(2, retryCount - 1);
          console.log(`Retry attempt ${retryCount} in ${delay}ms`);
          
          setTimeout(fetchData, delay);
          
          // Only show loading on initial load
          if (behaviorData.length === 0) {
            setLoading(true);
          }
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling every 5 seconds for real-time updates
    if (pollingActive) {
      intervalId = setInterval(fetchData, 5000);
    }

    // Clean up interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive]);

  // Format timestamp for charts
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get color based on attention score
  const getAttentionColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 50) return '#FFC107'; // Yellow
    return '#FF5252'; // Red
  };

  // Get color based on suspicion level
  const getSuspicionColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high':
        return '#FF5252'; // Red
      case 'medium':
        return '#FFC107'; // Yellow
      case 'low':
        return '#4CAF50'; // Green
      default:
        return '#4CAF50';
    }
  };

  // Prepare empty state or loading UI
  if (loading && behaviorData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Initializing monitoring...</p>
          <p className="text-sm text-gray-400 mt-2">Setting up behavioral tracking systems</p>
        </div>
      </div>
    );
  }

  if (error && behaviorData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg border border-red-500 max-w-md">
          <div className="text-5xl text-red-500 mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center"
              onClick={() => {
                setLoading(true);
                setError(null);
                setPollingActive(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Retry Connection
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-6">API Endpoint: /api/get_behavior_data</p>
        </div>
      </div>
    );
  }

  // If no data yet but we're still trying
  if (behaviorData.length === 0) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
          <span className="mr-3">👨‍💻</span>
          Behavioral Monitoring System
        </h1>
        
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Awaiting Monitoring Data</h2>
            <p className="text-gray-400 mb-6">
              The system is waiting for the first behavioral data points to arrive. Monitoring will begin automatically once data is available.
            </p>
            <div className="relative">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="animate-pulse h-full bg-blue-600 w-full opacity-50"></div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-4">Polling for data every 5 seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  const latestData: BehaviorData = behaviorData[behaviorData.length - 1];

  // Prepare time series data
  const timeSeriesData = behaviorData.map((d) => ({
    formattedTime: formatTimestamp(d.timestamp),
    focusedPercentage: d.currentFocused * 100, // Scale to 0-100
    attentionScore: d.attentionScore,
    gazeDeviationPercent: d.gazeDeviationPercent,
    cheatProbability: d.cheatProbability * 100, // Scale to 0-100
  }));

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
        <span className="text-4xl mr-2">👨‍💻</span>
        Real-time Behavioral Monitoring
      </h1>

      {/* Status Banner */}
      <div
        className={`p-4 mb-8 rounded-lg shadow-lg flex items-center justify-between ${
          latestData.suspicionLevel.toLowerCase() === 'low'
            ? 'bg-green-900 border-l-4 border-green-500'
            : latestData.suspicionLevel.toLowerCase() === 'medium'
            ? 'bg-yellow-900 border-l-4 border-yellow-500'
            : 'bg-red-900 border-l-4 border-red-500'
        }`}
      >
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <span className="mr-2">
              {latestData.suspicionLevel.toLowerCase() === 'low'
                ? '✅'
                : latestData.suspicionLevel.toLowerCase() === 'medium'
                ? '⚠️'
                : '🚨'}
            </span>
            Current Status: {latestData.suspicionLevel.toUpperCase()}
          </h2>
          <p className="opacity-75">Last updated: {formatTimestamp(latestData.timestamp)}</p>
        </div>
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              latestData.currentFocused ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          ></div>
          <span>{latestData.currentFocused ? 'Focused' : 'Distracted'}</span>
        </div>
      </div>

      {/* Controls and Stats */}
      <div className="flex flex-wrap mb-6 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 shadow-md flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 text-sm uppercase">Session Status</h3>
            <div className="relative inline-block w-12 align-middle select-none">
              <input 
                type="checkbox" 
                checked={pollingActive}
                onChange={() => setPollingActive(!pollingActive)}
                className="sr-only"
                id="toggle"
              />
              <label 
                htmlFor="toggle" 
                className={`block overflow-hidden h-6 rounded-full cursor-pointer ${pollingActive ? 'bg-blue-600' : 'bg-gray-600'}`}
              >
                <span className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${pollingActive ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </label>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className={`inline-block h-3 w-3 rounded-full ${pollingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`}></span>
            <span className="font-medium">{pollingActive ? 'Active Monitoring' : 'Monitoring Paused'}</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-md flex-1">
          <h3 className="text-gray-400 text-sm uppercase">Data Points</h3>
          <p className="mt-2 font-medium text-xl">{behaviorData.length}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-md flex-1">
          <h3 className="text-gray-400 text-sm uppercase">Monitoring Duration</h3>
          <p className="mt-2 font-medium text-xl">
            {behaviorData.length > 1 
              ? `${((new Date(latestData.timestamp).getTime() - new Date(behaviorData[0].timestamp).getTime()) / 1000).toFixed(1)}s` 
              : '0s'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focused Percentage Over Time */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Focus Tracking</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="formattedTime" stroke="#999" />
              <YAxis domain={[0, 100]} stroke="#999" />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="focusedPercentage"
                stroke="#4CAF50"
                fill="url(#colorFocus)"
                name="Focus Level (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attention Score Over Time */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Attention Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="formattedTime" stroke="#999" />
              <YAxis domain={[0, 100]} stroke="#999" />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="attentionScore"
                stroke="#8884d8"
                name="Attention Score (%)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gaze Deviation Over Time */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Gaze Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGaze" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF9800" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="formattedTime" stroke="#999" />
              <YAxis domain={[0, 100]} stroke="#999" />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="gazeDeviationPercent"
                stroke="#FF9800"
                fill="url(#colorGaze)"
                name="Gaze Deviation (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cheat Probability Over Time */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Integrity Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCheat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5252" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF5252" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="formattedTime" stroke="#999" />
              <YAxis domain={[0, 100]} stroke="#999" />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="cheatProbability"
                stroke="#FF5252"
                fill="url(#colorCheat)"
                name="Anomaly Detection (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center border-t-4" style={{ borderColor: getAttentionColor(latestData.attentionScore) }}>
          <h3 className="text-gray-400 text-sm uppercase">Attention Score</h3>
          <p
            className="text-3xl font-bold mt-2"
            style={{ color: getAttentionColor(latestData.attentionScore) }}
          >
            {latestData.attentionScore}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {latestData.attentionScore >= 80 ? 'Excellent' : latestData.attentionScore >= 50 ? 'Average' : 'Poor'}
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center border-t-4" style={{ borderColor: latestData.currentFocused ? '#4CAF50' : '#FF5252' }}>
          <h3 className="text-gray-400 text-sm uppercase">Focus Status</h3>
          <p
            className="text-3xl font-bold mt-2"
            style={{ color: latestData.currentFocused ? '#4CAF50' : '#FF5252' }}
          >
            {latestData.currentFocused ? 'Focused' : 'Distracted'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Real-time tracking</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center border-t-4 border-blue-600">
          <h3 className="text-gray-400 text-sm uppercase">Gaze Deviation</h3>
          <p className="text-3xl font-bold mt-2 text-blue-500">{latestData.gazeDeviationPercent}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {latestData.gazeDeviationPercent <= 10 ? 'Stable' : latestData.gazeDeviationPercent <= 30 ? 'Variable' : 'Unstable'}
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center border-t-4" style={{ borderColor: getSuspicionColor(latestData.suspicionLevel) }}>
          <h3 className="text-gray-400 text-sm uppercase">Suspicion Level</h3>
          <p
            className="text-3xl font-bold mt-2"
            style={{ color: getSuspicionColor(latestData.suspicionLevel) }}
          >
            {latestData.suspicionLevel.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {latestData.suspicionLevel.toLowerCase() === 'low' ? 'Safe' : latestData.suspicionLevel.toLowerCase() === 'medium' ? 'Caution' : 'Alert'}
          </p>
        </div>
      </div>
      
      {/* Footer with version info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Behavioral Monitoring System v1.0.2</p>
        <p className="text-xs mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}