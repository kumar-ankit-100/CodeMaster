"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, FileCode, CheckCircle, Github, Cpu, Lightbulb, ChevronRight, Rocket, ArrowUpFromLine, ArrowDownToLine } from "lucide-react";

const ContributePage = () => {
    const [structureContent, setStructureContent] = useState("");
    const [problemContent, setProblemContent] = useState("");
    const [inputContent, setInputContent] = useState("");
    const [outputContent, setOutputContent] = useState("");




    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!structureContent || !problemContent || !inputContent || !outputContent ) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/boilerplate-generator", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                structureContent,
                problemContent,
                inputContent,
                outputContent
              }),
            });
            
            const data = await response.json();
            
            if (data.success) {
              setIsSuccess(true);
            } else {
              console.error("Error:", data.error);
              alert("Failed to generate boilerplate: " + data.error);
            }
          } catch (error) {
            console.error("Error submitting form:", error);
            alert("An error occurred while generating the boilerplate code.");
          } finally {
            setIsSubmitting(false);
          }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                {/* Header Section */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text">
                        Contribute Interview Questions
                    </h1>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                        Help fellow developers prepare for technical interviews by contributing quality coding problems with structured solutions.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Form Section */}
                    <motion.div
                        className="md:col-span-2 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 shadow-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <div className="flex items-center mb-3">
                                    <FileCode className="mr-2 text-purple-400" size={20} />
                                    <label className="text-lg font-medium">structure.md</label>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={structureContent}
                                        onChange={(e) => setStructureContent(e.target.value)}
                                        className="w-full h-56 bg-gray-900/80 text-gray-100 p-4 rounded-lg border border-purple-500/30 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="# Problem Title
## Difficulty: Easy/Medium/Hard
## Tags: Array, Sorting, etc.

## Solution Approach:
1. Describe the approach here
2. Include complexity analysis

## Code Structure:
```javascript
function solution(input) {
  // Explain key parts
}
```"
                                    />
                                    <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
                                        structure.md
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
            <div className="flex items-center mb-3">
                <FileCode className="mr-2 text-purple-400" size={20} />
                <label className="text-lg font-medium">Problem Definition (JSON)</label>
            </div>
            <div className="relative">
                <textarea
                    value={problemContent}
                    onChange={(e) => setProblemContent(e.target.value)}
                    className="w-full h-64 bg-gray-900/80 text-gray-100 p-4 rounded-lg border border-purple-500/30 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder={`{
  "id": "1",
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ],
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "slug": "two-sum"
}`}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
                    JSON Format
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                Enter the problem definition in JSON format with fields for id, title, description, examples, constraints, difficulty, tags, and slug.
            </div>
        </div>

         {/* Input Box */}
         <div className="mb-6">
            <div className="flex items-center mb-3">
                <ArrowDownToLine className="mr-2 text-green-400" size={20} />
                <label className="text-lg font-medium">Input Examples</label>
            </div>
            <div className="relative">
                <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="w-full h-32 bg-gray-900/80 text-gray-100 p-4 rounded-lg border border-green-500/30 font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder={`["4 5", "10 20", "3 7"]`}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
                    Input Array
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                Enter input examples as a JSON array of strings
            </div>
        </div>
        
        {/* Output Box */}
        <div className="mb-6">
            <div className="flex items-center mb-3">
                <ArrowUpFromLine className="mr-2 text-blue-400" size={20} />
                <label className="text-lg font-medium">Output Examples</label>
            </div>
            <div className="relative">
                <textarea
                    value={outputContent}
                    onChange={(e) => setOutputContent(e.target.value)}
                    className="w-full h-32 bg-gray-900/80 text-gray-100 p-4 rounded-lg border border-blue-500/30 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={`["9", "30", "10"]`}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
                    Output Array
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                Enter expected output examples as a JSON array of strings
            </div>
        </div>

                          

                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${isSuccess
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    } transition-all duration-300 shadow-lg`}
                                disabled={isSubmitting || isSuccess}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </div>
                                ) : isSuccess ? (
                                    <div className="flex items-center">
                                        <CheckCircle className="mr-2" size={20} />
                                        <span>Contribution Submitted!</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Rocket className="mr-2" size={20} />
                                        <span>Submit Contribution</span>
                                    </div>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Right Side Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="md:col-span-1"
                    >
                        {/* Tips Section */}
                        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30 shadow-lg mb-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <Lightbulb className="mr-2 text-yellow-400" size={20} />
                                Contribution Tips
                            </h3>
                            <motion.ul
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-3"
                            >
                                <motion.li variants={itemVariants} className="flex items-start">
                                    <ChevronRight className="mr-2 text-purple-400 flex-shrink-0 mt-1" size={16} />
                                    <span className="text-gray-300">Use markdown for better formatting</span>
                                </motion.li>
                                <motion.li variants={itemVariants} className="flex items-start">
                                    <ChevronRight className="mr-2 text-purple-400 flex-shrink-0 mt-1" size={16} />
                                    <span className="text-gray-300">Include multiple test cases</span>
                                </motion.li>
                                <motion.li variants={itemVariants} className="flex items-start">
                                    <ChevronRight className="mr-2 text-purple-400 flex-shrink-0 mt-1" size={16} />
                                    <span className="text-gray-300">Explain your solution approach clearly</span>
                                </motion.li>
                                <motion.li variants={itemVariants} className="flex items-start">
                                    <ChevronRight className="mr-2 text-purple-400 flex-shrink-0 mt-1" size={16} />
                                    <span className="text-gray-300">Add time and space complexity analysis</span>
                                </motion.li>
                            </motion.ul>
                        </div>

                        {/* Example Contribution */}
                        <motion.div
                            className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 shadow-lg"
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <Cpu className="mr-2 text-green-400" size={20} />
                                Example Contribution
                            </h3>
                            <div className="bg-gray-900/70 rounded-lg p-4 mb-4">
                                <h4 className="text-green-400 font-mono text-sm mb-1">structure.md</h4>
                                <div className="text-xs text-gray-300 font-mono">
                                    # Two Sum<br />
                                    ## Difficulty: Easy<br />
                                    ## Tags: Array, Hash Table<br /><br />

                                    ## Solution Approach:<br />
                                    1. Use a hash map to store numbers...<br />
                                    2. For each element, check if target - num...
                                </div>
                            </div>
                            <div className="bg-gray-900/70 rounded-lg p-4">
                                <h4 className="text-cyan-400 font-mono text-sm mb-1">problem.md</h4>
                                <div className="text-xs text-gray-300 font-mono">
                                    # Two Sum<br /><br />

                                    Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.<br /><br />

                                    ## Examples<br />
                                    Input: nums = [2,7,11,15], target = 9<br />
                                    Output: [0,1]
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Community Contributions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="mt-12"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <Github className="mr-2" size={24} />
                        Recent Contributions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Merge Intervals",
                                difficulty: "Medium",
                                tags: ["Array", "Sorting"],
                                author: "codemaster42"
                            },
                            {
                                title: "Valid Parentheses",
                                difficulty: "Easy",
                                tags: ["Stack", "String"],
                                author: "devguru"
                            },
                            {
                                title: "LRU Cache",
                                difficulty: "Hard",
                                tags: ["Hash Table", "Linked List"],
                                author: "algoninja"
                            },
                        ].map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="bg-gray-800/40 backdrop-blur-md rounded-xl overflow-hidden border border-purple-500/20 shadow-lg group"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold">{card.title}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${card.difficulty === "Easy"
                                                ? "bg-green-900/60 text-green-400"
                                                : card.difficulty === "Medium"
                                                    ? "bg-yellow-900/60 text-yellow-400"
                                                    : "bg-red-900/60 text-red-400"
                                            }`}>
                                            {card.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {card.tags.map((tag, idx) => (
                                            <span key={idx} className="bg-gray-700/60 px-2 py-1 rounded-md text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">by {card.author}</span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        >
                                            View
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ContributePage;