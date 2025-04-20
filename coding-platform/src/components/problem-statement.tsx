interface Example {
    input: string
    output: string
    explanation?: string
  }
  
  interface ProblemProps {
    title: string
    description: string
    examples: Example[]
    constraints: string[]
  }
  
  interface ProblemStatementProps {
    problem: ProblemProps
  }
  
  export default function ProblemStatement({ problem }: ProblemStatementProps) {
    return (
      <div className="p-6 overflow-y-auto h-[500px] text-gray-200">
        <h2 className="text-2xl font-bold text-white mb-4">{problem.title}</h2>
        <div className="mb-6">
          <p className="mb-4">{problem.description}</p>
        </div>
  
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Examples:</h3>
          {problem.examples.map((example, index) => (
            <div key={index} className="mb-4 bg-gray-800/50 p-4 rounded-md">
              <div className="mb-2">
                <span className="font-semibold text-purple-400">Input:</span> {example.input}
              </div>
              <div className="mb-2">
                <span className="font-semibold text-cyan-400">Output:</span> {example.output}
              </div>
              {example.explanation && (
                <div>
                  <span className="font-semibold text-blue-400">Explanation:</span> {example.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
  
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Constraints:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {problem.constraints.map((constraint, index) => (
              <li key={index}>{constraint}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
  
  