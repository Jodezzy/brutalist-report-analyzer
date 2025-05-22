"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, ExternalLink, Hash, Globe, Clock, FileText, ImageIcon } from "lucide-react"
import { cn } from "../utils"
import type { TopicGroup } from "../types/analysis"

interface TopicGroupCardProps {
  group: TopicGroup
  isExpanded: boolean
  onToggle: () => void
}

const TopicGroupCard: React.FC<TopicGroupCardProps> = ({ group, isExpanded, onToggle }) => {
  // Group headlines by source
  const headlinesBySource: Record<string, Array<{ title: string; url: string; time?: string }>> = {}
  const [topicImage, setTopicImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  group.headlines.forEach((headline) => {
    if (!headlinesBySource[headline.source]) {
      headlinesBySource[headline.source] = []
    }
    headlinesBySource[headline.source].push({
      title: headline.title,
      url: headline.url,
      time: headline.time,
    })
  })

  // Count sources and articles
  const sourceCount = Object.keys(headlinesBySource).length
  const headlineCount = group.count || group.headlines.length

  return (
    <div className="bg-gray-700/80 rounded-xl overflow-hidden transition-all duration-200 border border-gray-600/50 shadow-md h-full flex flex-col hover:shadow-lg hover:border-indigo-800/50">
      {/* Header - Always visible */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600/70 transition-colors duration-200 border-b border-gray-600/30 relative overflow-hidden"
        onClick={onToggle}
      >
        <div className="flex items-center relative">
          <div className="bg-indigo-900/50 p-1.5 rounded-full mr-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-indigo-400 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-indigo-400 transition-transform duration-200" />
            )}
          </div>
          <h3 className="font-medium text-indigo-100">{group.topic_name}</h3>
        </div>
        <div className="text-sm text-indigo-300/80 bg-gray-800/50 px-2 py-1 rounded-md flex items-center">
          <Globe className="h-3 w-3 mr-1" />
          <span>{sourceCount}</span>
          <span className="mx-1">•</span>
          <FileText className="h-3 w-3 mr-1" />
          <span>{headlineCount}</span>
        </div>
      </div>

      {/* EXPERIMENTAL FEATURE: Topic Image */}
      {topicImage && (
        <div className="relative h-32 overflow-hidden">
          <img src={topicImage || "/placeholder.svg"} alt={group.topic_name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
          <div className="absolute bottom-2 left-2 flex items-center text-xs text-white bg-gray-900/60 px-2 py-1 rounded">
            <ImageIcon className="h-3 w-3 mr-1" />
            <span>Topic visualization</span>
          </div>
        </div>
      )}
      {/* END OF EXPERIMENTAL FEATURE */}

      {/* Collapsible Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="p-5 pt-3 space-y-4 bg-gray-750/30">
          {Object.entries(headlinesBySource).map(([source, headlines]) => (
            <div key={source} className="border-t border-gray-600/30 pt-3">
              <h4 className="font-medium text-indigo-300 mb-3 flex items-center">
                <div className="bg-indigo-800/40 p-1 rounded mr-2 flex items-center justify-center">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                {source}
              </h4>
              <ul className="space-y-0">
                {headlines.map((headline, idx) => (
                  <li key={idx} className="border-b border-gray-600/20 last:border-0">
                    <a
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-indigo-300 flex items-start group transition-colors duration-200 py-2.5 px-1"
                    >
                      <div className="flex items-center mr-2 mt-1">
                        <div className="bg-indigo-900/30 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0">
                          <Hash className="h-3 w-3 text-indigo-400" />
                        </div>
                      </div>
                      <span className="flex-1">{headline.title}</span>
                      {headline.time && (
                        <span className="text-xs text-indigo-300/60 ml-2 whitespace-nowrap flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {headline.time}
                        </span>
                      )}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopicGroupCard
