import type React from "react"
import { Loader2, CheckCircle, AlertCircle, Clock, Server } from "lucide-react"

interface JobStatusProps {
  status: "idle" | "loading" | "success" | "error"
  message: string
  processedCount?: number
  totalCount?: number
}

const JobStatus: React.FC<JobStatusProps> = ({ status, message, processedCount, totalCount }) => {
  // Calculate progress percentage
  const progressPercentage = processedCount && totalCount ? Math.round((processedCount / totalCount) * 100) : 0

  // Check if this is a date processing message
  const isDateProcessing = message.includes("Processing date") || message.includes("date")

  return (
    <div className="bg-gray-700/80 rounded-xl p-5 border border-gray-600/50 shadow-md relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern
              id="diagonalLines"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines)" />
        </svg>
      </div>

      <div className="flex items-center mb-3 relative">
        {status === "loading" && (
          <div className="bg-indigo-600/20 p-2 rounded-full mr-3">
            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="bg-green-600/20 p-2 rounded-full mr-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-600/20 p-2 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
        )}
        <span className="font-medium text-indigo-100">
          {status === "loading" && (
            <>
              Analysis in progress
              {/* Show different info based on message type */}
              {!isDateProcessing && processedCount !== undefined && totalCount !== undefined && (
                <span className="text-indigo-200/80 ml-2">
                  ({processedCount} of {totalCount} headlines)
                </span>
              )}
            </>
          )}
          {status === "success" && "Analysis completed"}
          {status === "error" && "Error"}
        </span>
      </div>

      {status === "loading" && !isDateProcessing && processedCount !== undefined && totalCount !== undefined && (
        <div className="space-y-2 my-4 relative">
          <div className="w-full bg-gray-600/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-indigo-300/80">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Processing</span>
            </div>
            <div>{progressPercentage}%</div>
          </div>
        </div>
      )}

      <div className="flex items-start mt-3 relative">
        <Server className="h-4 w-4 text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-gray-200">{message}</p>
      </div>
    </div>
  )
}

export default JobStatus
