"use client"

import type React from "react"
import { useState } from "react"
import { Save, HelpCircle, Layers, BarChart3 } from "lucide-react"
import Button from "./ui/Button"
import Modal from "./ui/Modal"
import TopicGroupCard from "./TopicGroupCard"
import WordCloud from "./WordCloud"
import { useAnalysis } from "../hooks/useAnalysis"
import type { AnalysisResult } from "../types/analysis"

interface ResultsViewProps {
  result: AnalysisResult
  onSaveResults: () => void
  onLoadResults: () => void
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onSaveResults, onLoadResults }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [showWordCloud, setShowWordCloud] = useState(false)
  const { showSaveModal, saveModalMessage, setShowSaveModal } = useAnalysis()

  const toggleGroup = (index: number) => {
    const newSet = new Set(expandedGroups)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setExpandedGroups(newSet)
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gray-700/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between border border-gray-600/50 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        <div className="space-y-2 mb-4 md:mb-0 relative">
          <div className="flex items-center">
            <Layers className="h-5 w-5 text-indigo-400 mr-2" />
            <h3 className="text-lg font-medium text-indigo-200">Analysis Summary</h3>
          </div>
          <p className="text-gray-200">
            Found {result.total_groups} topic groups with {result.total_headlines} headlines
          </p>
          <p className="text-indigo-300/80 text-sm">
            {result.topic ? `Topic: ${result.topic}` : "All topics"} •{result.is_last_week ? " Last week" : " Today"} •
            Date: {result.date}
          </p>
        </div>

        <div className="flex gap-3 relative">
          <div className="group relative">
            <Button onClick={() => setShowWordCloud(!showWordCloud)} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              {showWordCloud ? "Hide" : "Show"} Word Cloud
            </Button>
            <div className="absolute bottom-full mb-2 right-0 bg-gray-800 text-xs text-white p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none">
              {showWordCloud ? "Hide" : "Show"} word frequency visualization
            </div>
          </div>
          <div className="group relative">
            <Button onClick={onSaveResults} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save JSON
            </Button>
            <div className="absolute bottom-full mb-2 right-0 bg-gray-800 text-xs text-white p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none">
              Save analysis results to a JSON file
            </div>
          </div>
        </div>
      </div>

      {/* Word Cloud Section */}
      {showWordCloud && <WordCloud result={result} />}

      <div className="flex items-center gap-2 px-2 bg-indigo-900/20 py-2 rounded-lg border border-indigo-800/30">
        <HelpCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
        <p className="text-sm text-indigo-300">Click on a topic card to expand and view related articles</p>
      </div>

      {/* Topic Groups - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.common_topics.map((group, index) => (
          <TopicGroupCard
            key={index}
            group={group}
            isExpanded={expandedGroups.has(index)}
            onToggle={() => toggleGroup(index)}
          />
        ))}
      </div>

      {/* Save Success Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Results">
        <div className="space-y-4">
          <p className="text-gray-200 whitespace-pre-line">{saveModalMessage}</p>
          <Button onClick={() => setShowSaveModal(false)} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ResultsView
