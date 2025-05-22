import React, { useState } from 'react';
import { Save, FolderOpen } from 'lucide-react';
import Button from './ui/Button';
import TopicGroupCard from './TopicGroupCard';
import { AnalysisResult } from '../types/analysis';

interface ResultsViewProps {
  result: AnalysisResult;
  onSaveResults: () => void;
  onLoadResults: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  result, 
  onSaveResults, 
  onLoadResults 
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  const toggleGroup = (index: number) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedGroups(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1 mb-4 md:mb-0">
          <h3 className="text-lg font-medium">Analysis Summary</h3>
          <p className="text-gray-300">
            Found {result.total_groups} topic groups with {result.total_headlines} headlines
          </p>
          <p className="text-gray-400 text-sm">
            {result.topic ? `Topic: ${result.topic}` : 'All topics'} • 
            {result.is_last_week ? ' Last week' : ' Today'} • 
            Date: {result.date}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onSaveResults} variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save JSON
          </Button>
          <Button onClick={onLoadResults} variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-1" />
            Open JSON
          </Button>
        </div>
      </div>
      
      {/* Topic Groups */}
      <div className="space-y-4">
        {result.common_topics.map((group, index) => (
          <TopicGroupCard 
            key={index}
            group={group}
            isExpanded={expandedGroups.has(index)}
            onToggle={() => toggleGroup(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsView;