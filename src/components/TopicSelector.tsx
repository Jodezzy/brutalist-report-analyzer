"use client"

import type React from "react"
import { Search, Info, Filter, Calendar } from "lucide-react"
import Button from "./ui/Button"
import { TOPICS } from "../constants"

interface TopicSelectorProps {
  selectedTopic: string | null
  onSelectTopic: (topic: string | null) => void
  timeRange: "today" | "last-week"
  onSelectTimeRange: (range: "today" | "last-week") => void
  onStartAnalysis: () => void
  isLoading: boolean
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
  timeRange,
  onSelectTimeRange,
  onStartAnalysis,
  isLoading,
}) => {
  // Create a visual representation of available topics
  const topicIcons: Record<string, string> = {
    tech: "💻",
    news: "📰",
    business: "💼",
    science: "🔬",
    gaming: "🎮",
    culture: "🎭",
    politics: "🏛️",
    sports: "⚽",
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Selection - Using only the visual topic chips */}
        <div>
          <div className="flex items-center mb-3">
            <Filter className="h-4 w-4 text-indigo-400 mr-2" />
            <label className="block text-sm font-medium text-indigo-200">Select Topic</label>
            <div className="group relative ml-2">
              <Info className="h-4 w-4 text-indigo-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 bg-gray-800 text-xs text-white p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none z-10">
                Filter news by a specific topic or view all topics
              </div>
            </div>
          </div>

          {/* Visual topic chips */}
          <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelectTopic(null)}
                className={`px-3 py-2 rounded-lg flex items-center transition-all ${
                  selectedTopic === null
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                🔍 All Topics
              </button>
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => onSelectTopic(topic)}
                  className={`px-3 py-2 rounded-lg flex items-center transition-all ${
                    selectedTopic === topic
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                >
                  {topicIcons[topic] || "🔍"} {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Range Selection - Using the visual time range selector */}
        <div>
          <div className="flex items-center mb-3">
            <Calendar className="h-4 w-4 text-indigo-400 mr-2" />
            <label className="block text-sm font-medium text-indigo-200">Time Range</label>
            <div className="group relative ml-2">
              <Info className="h-4 w-4 text-indigo-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 bg-gray-800 text-xs text-white p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none z-10">
                Choose to analyze today's news or the past week
              </div>
            </div>
          </div>

          {/* Visual time range selector */}
          <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => onSelectTimeRange("today")}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-all ${
                  timeRange === "today"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                <span className="text-lg mr-2">📅</span>
                Today
              </button>

              <div className="px-2 text-gray-500">or</div>

              <button
                onClick={() => onSelectTimeRange("last-week")}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-all ${
                  timeRange === "last-week"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                <span className="text-lg mr-2">📆</span>
                Last Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Button */}
      <div>
        <div className="relative inline-block">
          <Button
            onClick={onStartAnalysis}
            disabled={isLoading}
            className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Analyzing..." : "Start Analysis"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-indigo-300/80 flex items-center">
          <Info className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
          {selectedTopic
            ? `Analyzing ${selectedTopic} news from ${timeRange === "today" ? "today" : "the last week"}`
            : `Analyzing all news from ${timeRange === "today" ? "today" : "the last week"}`}
        </p>
      </div>
    </div>
  )
}

export default TopicSelector
