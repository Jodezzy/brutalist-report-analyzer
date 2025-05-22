import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';
import TopicSelector from './components/TopicSelector';
import JobStatus from './components/JobStatus';
import ResultsView from './components/ResultsView';
import { useAnalysis } from './hooks/useAnalysis';
import { type AnalysisResult } from './types/analysis';

function App() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'last-week'>('today');
  const { 
    startAnalysis, 
    status,  
    result, 
    message, 
    loadFromFile, 
    saveToFile,
    processedCount,
    totalCount
  } = useAnalysis();
  
  const handleStartAnalysis = () => {
    startAnalysis(selectedTopic, timeRange === 'last-week');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Newspaper className="h-8 w-8 text-indigo-400" />
          <h1 className="text-2xl font-bold">Brutalist Report Analyzer</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Controls Section */}
        <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Analysis Configuration</h2>
          
          <TopicSelector 
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            timeRange={timeRange}
            onSelectTimeRange={setTimeRange}
            onStartAnalysis={handleStartAnalysis}
            isLoading={status === 'loading'}
          />
        </section>
        
        {/* Status Section */}
        {(status !== 'idle' || result) && (
          <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            
            <JobStatus 
              status={status}
              message={message}
              processedCount={processedCount}
              totalCount={totalCount}
            />
          </section>
        )}
        
        {/* Results Section */}
        {result && (
          <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            <ResultsView 
              result={result as AnalysisResult}
              onSaveResults={saveToFile}
              onLoadResults={loadFromFile}
            />
          </section>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          © 2025 Brutalist Report Analyzer • Data sourced from brutalist.report
        </div>
      </footer>
    </div>
  );
}

export default App;