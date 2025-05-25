"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Hash,
  Globe,
  Clock,
  FileText,
  ImageIcon,
  AlertTriangle,
  ExternalLinkIcon,
  AlertCircle,
  Info,
} from "lucide-react"
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

  // Check if we have a successful image or error information
  const hasSuccessfulImage = group.image && group.image.url && !group.image.error
  const hasImageError = group.image && group.image.error
  const shouldShowImageContainer = hasSuccessfulImage || hasImageError

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

      {/* =====================================================================
          EXPERIMENTAL FEATURE: Real Article Image Header with Error Display
          This section displays an image extracted from news articles OR shows error information
          The image data is saved in the JSON and comes from the Python backend
          If you want to remove this feature, delete this entire div block
          ===================================================================== */}
      {shouldShowImageContainer && (
        <div className="relative h-40 overflow-hidden">
          {hasSuccessfulImage && !imageError ? (
            <>
              {/* Successful image display */}
              <img
                src={group.image!.url || "/placeholder.svg"}
                alt={group.image!.alt}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>

              {/* Image info overlay */}
              <div className="absolute bottom-2 left-2 flex items-center text-xs text-white bg-gray-900/80 px-2 py-1 rounded max-w-[60%]">
                <ImageIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{group.image!.alt}</span>
              </div>

              {/* Source link */}
              <div className="absolute bottom-2 right-2">
                <a
                  href={group.image!.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-white bg-gray-900/80 px-2 py-1 rounded hover:bg-gray-800/90 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLinkIcon className="h-3 w-3 mr-1" />
                  <span>Source</span>
                </a>
              </div>

              Experimental badge
              <div className="absolute top-2 right-2 flex items-center text-xs text-yellow-300 bg-yellow-900/80 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Experimental</span>
              </div>
            </>
          ) : (
            <>
              {/* Error display */}
              <div className="w-full h-full bg-gray-800/90 flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
                  <div className="text-sm text-red-300 font-medium">Image Extraction Failed</div>
                  <div className="text-xs text-gray-300 max-w-full">
                    {group.image?.error_type === "ExtractionFailure" ? (
                      <div className="space-y-1">
                        <div>Tried {group.image.total_attempts} sources:</div>
                        <div className="text-xs text-gray-400">{group.image.attempted_sources?.join(", ")}</div>
                      </div>
                    ) : (
                      <div className="truncate">{group.image?.error || "Unknown error"}</div>
                    )}
                  </div>
                </div>

                {/* Error details button */}
                {group.image?.detailed_errors && group.image.detailed_errors.length > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <div className="group relative">
                      <div className="flex items-center text-xs text-gray-300 bg-gray-900/80 px-2 py-1 rounded cursor-help">
                        <Info className="h-3 w-3 mr-1" />
                        <span>Error Details</span>
                      </div>
                      <div className="absolute bottom-full mb-2 left-0 bg-gray-900 text-xs text-white p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-64 pointer-events-none z-10">
                        <div className="space-y-2">
                          {group.image.detailed_errors.slice(0, 3).map((error, idx) => (
                            <div key={idx} className="border-b border-gray-700 pb-1 last:border-0">
                              <div className="font-medium text-red-300">{error.source}</div>
                              <div className="text-gray-400 truncate">{error.error}</div>
                            </div>
                          ))}
                          {group.image.detailed_errors.length > 3 && (
                            <div className="text-gray-500 text-center">
                              +{group.image.detailed_errors.length - 3} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Experimental badge
                <div className="absolute top-2 right-2 flex items-center text-xs text-yellow-300 bg-yellow-900/80 px-2 py-1 rounded">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Experimental</span>
                </div> */}
              </div>
            </>
          )}
        </div>
      )}
      {/* =====================================================================
          END OF EXPERIMENTAL FEATURE
          ===================================================================== */}

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
