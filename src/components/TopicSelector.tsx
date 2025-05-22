import React from 'react';
import { Search } from 'lucide-react';
import Button from './ui/Button';
import { TOPICS } from '../constants';

interface TopicSelectorProps {
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  timeRange: 'today' | 'last-week';
  onSelectTimeRange: (range: 'today' | 'last-week') => void;
  onStartAnalysis: () => void;
  isLoading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
  timeRange,
  onSelectTimeRange,
  onStartAnalysis,
  isLoading
}) => {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Selection */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
            Select Topic (Optional)
          </label>
          <select
            id="topic"
            className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
            value={selectedTopic || ''}
            onChange={(e) => onSelectTopic(e.target.value || null)}
          >
            <option value="">All Topics</option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Time Range
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-indigo-600"
                name="timeRange"
                checked={timeRange === 'today'}
                onChange={() => onSelectTimeRange('today')}
              />
              <span className="ml-2">Today</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-indigo-600"
                name="timeRange"
                checked={timeRange === 'last-week'}
                onChange={() => onSelectTimeRange('last-week')}
              />
              <span className="ml-2">Last Week</span>
            </label>
          </div>
        </div>
      </div>

      {/* Analysis Button */}
      <div>
        <Button 
          onClick={onStartAnalysis} 
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? 'Analyzing...' : 'Start Analysis'}
        </Button>
        <p className="mt-2 text-sm text-gray-400">
          {selectedTopic 
            ? `Analyzing ${selectedTopic} news from ${timeRange === 'today' ? 'today' : 'the last week'}`
            : `Analyzing all news from ${timeRange === 'today' ? 'today' : 'the last week'}`}
        </p>
      </div>
    </div>
  );
};

export default TopicSelector;