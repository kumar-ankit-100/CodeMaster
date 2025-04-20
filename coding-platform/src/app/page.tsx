// src/app/page.tsx
"use client";

import Navbar from "@/components/Navbar"; 
import { motion } from "framer-motion";
import { BarChart2, Code, Users, Zap, Terminal, GitBranch, Server } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [showCodingPlatform, setShowCodingPlatform] = useState(false);
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 md:px-12 flex flex-col items-center text-center">
        <div className="flex">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-600"
        >
          Master Coding Interviews with AI
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <Terminal className="w-16 h-16 text-purple-400" />
        </motion.div>
        
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mt-3 flex justify-center space-x-2 text-sm text-gray-400 font-mono"
        >
          <span>&lt;/&gt;</span>
          <span>function prepare() &#123; return success; &#125;</span>
          <span>&lt;/&gt;</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl"
        >
          Practice with realistic AI-powered interviews, get instant feedback, and level up your skills with personalized challenges.
        </motion.p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Link href="/all_round">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-mono rounded-md shadow-lg shadow-purple-900/30 transition-all duration-300 transform hover:scale-105 flex items-center">
              <span>START CODING ROUND</span>
              <Code className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </motion.div>
      </section>
{/* Code Snippet Banner */}
<section className="py-16 px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto bg-gray-800/70 border border-purple-800/30 rounded-lg overflow-hidden shadow-2xl"
        >
          <div className="bg-gray-900 px-4 py-2 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="ml-4 text-gray-400 text-sm font-mono">interview_prep.js</div>
          </div>
          <div className="p-6 font-mono text-sm">
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">1</div>
              <div><span className="text-purple-400">function</span> <span className="text-cyan-300">findOptimalSolution</span><span className="text-gray-300">(</span><span className="text-orange-300">problem</span><span className="text-gray-300">)</span> <span className="text-gray-300">{`{`}</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">2</div>
              <div className="pl-4"><span className="text-purple-400">const</span> <span className="text-blue-300">strategies</span> <span className="text-gray-300">=</span> <span className="text-gray-300">[];</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">3</div>
              <div className="pl-4"><span className="text-purple-400">let</span> <span className="text-blue-300">bestSolution</span> <span className="text-gray-300">=</span> <span className="text-orange-300">null</span><span className="text-gray-300">;</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">4</div>
              <div> </div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">5</div>
              <div className="pl-4"><span className="text-green-400">// Analyze the problem and break it down</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">6</div>
              <div className="pl-4"><span className="text-purple-400">const</span> <span className="text-blue-300">analysis</span> <span className="text-gray-300">=</span> <span className="text-cyan-300">analyzeComplexity</span><span className="text-gray-300">(</span><span className="text-orange-300">problem</span><span className="text-gray-300">);</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">7</div>
              <div> </div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">8</div>
              <div className="pl-4"><span className="text-orange-400">return</span> <span className="text-cyan-300">optimizedSolution</span><span className="text-gray-300">(</span><span className="text-orange-300">problem</span><span className="text-gray-300">,</span> <span className="text-blue-300">analysis</span><span className="text-gray-300">);</span></div>
            </div>
            <div className="flex">
              <div className="text-gray-500 pr-4 select-none">9</div>
              <div><span className="text-gray-300">{`}`}</span></div>
            </div>
          </div>
        </motion.div>
      </section>
      {/* Features Section */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-800/70 border border-purple-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-purple-600/20 hover:border-purple-600/50 transition-all duration-300 group"
            >
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Terminal className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-mono font-semibold text-purple-300">Real-Time Coding</h3>
              <p className="mt-2 text-gray-400 font-light">
                <span className="text-purple-400 font-mono">const editor =</span> Solve problems with an integrated editor powered by Monaco, with live execution and detailed metrics.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-800/70 border border-cyan-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-cyan-600/20 hover:border-cyan-600/50 transition-all duration-300 group"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-mono font-semibold text-cyan-300">Anti-Cheating</h3>
              <p className="mt-2 text-gray-400 font-light">
                <span className="text-cyan-400 font-mono">function monitor() {`{`}</span> Live video monitoring to detect face movement, multiple faces, and eye movement during coding rounds.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-800/70 border border-pink-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-pink-600/20 hover:border-pink-600/50 transition-all duration-300 group"
            >
              <div className="bg-gradient-to-br from-pink-500 to-red-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-mono font-semibold text-pink-300">Instant Feedback</h3>
              <p className="mt-2 text-gray-400 font-light">
                <span className="text-pink-400 font-mono">return</span> Get detailed performance reports and personalized tips to improve your coding and interview skills.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Extra Feature Row */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800/70 border border-indigo-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-indigo-600/20 hover:border-indigo-600/50 transition-all duration-300 group"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-mono font-semibold text-indigo-300">Algorithm Mastery</h3>
            <p className="mt-2 text-gray-400 font-light">
              <span className="text-indigo-400 font-mono">git checkout</span> Deep dive into data structures and algorithms with interactive visualizations and step-by-step guides.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800/70 border border-green-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-green-600/20 hover:border-green-600/50 transition-all duration-300 group"
          >
            <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <Server className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-mono font-semibold text-green-300">System Design</h3>
            <p className="mt-2 text-gray-400 font-light">
              <span className="text-green-400 font-mono">docker build</span> Learn to architect scalable systems with interactive design challenges and detailed feedback.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-800/70 border border-orange-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl hover:shadow-orange-600/20 hover:border-orange-600/50 transition-all duration-300 group"
          >
            <div className="bg-gradient-to-br from-orange-500 to-yellow-600 p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-mono font-semibold text-orange-300">Progress Tracking</h3>
            <p className="mt-2 text-gray-400 font-light">
              <span className="text-orange-400 font-mono">analytics.track()</span> Monitor your improvement with detailed stats and personalized learning paths.
            </p>
          </motion.div>
        </div>
      </section>


    </main>
  );
}