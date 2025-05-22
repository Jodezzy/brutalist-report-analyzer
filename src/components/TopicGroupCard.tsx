import React from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../utils';
import { TopicGroup } from '../types/analysis';

interface TopicGroupCardProps {
  group: TopicGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

const TopicGroupCard: React.FC<TopicGroupCardProps> = ({ 
  group, 
  isExpanded, 
  onToggle 
}) => {
  // Group headlines by source
  const headlinesBySource: Record<string, Array<{title: string, url: string, time?: string}>> = {};
  
  group.headlines.forEach(headline => {
    if (!headlinesBySource[headline.source]) {
      headlinesBySource[headline.source] = [];
    }
    headlinesBySource[headline.source].push({
      title: headline.title,
      url: headline.url,
      time: headline.time
    });
  });
  
  // Count sources and articles
  const sourceCount = Object.keys(headlinesBySource).length;
  const headlineCount = group.count || group.headlines.length;

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden transition-all duration-200">
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600"
        onClick={onToggle}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-indigo-400 mr-2" />
          ) : (
            <ChevronRight className="h-5 w-5 text-indigo-400 mr-2" />
          )}
          <h3 className="font-medium">{group.topic_name}</h3>
        </div>
        <div className="text-sm text-gray-400">
          Sources: {sourceCount} | Articles: {headlineCount}
        </div>
      </div>
      
      {/* Collapsible Content */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0 space-y-4">
          {Object.entries(headlinesBySource).map(([source, headlines]) => (
            <div key={source} className="border-t border-gray-600 pt-3">
              <h4 className="font-medium text-indigo-300 mb-2">{source}</h4>
              <ul className="space-y-2">
                {headlines.map((headline, idx) => (
                  <li key={idx} className="flex items-start">
                    <a 
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-indigo-400 flex items-start group"
                    >
                      <span className="flex-1">{headline.title}</span>
                      {headline.time && (
                        <span className="text-xs text-gray-400 ml-2">[{headline.time}]</span>
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
  );
};

export default TopicGroupCard;