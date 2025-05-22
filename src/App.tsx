"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Globe } from "lucide-react";
import TopicSelector from "./components/TopicSelector";
import JobStatus from "./components/JobStatus";
import ResultsView from "./components/ResultsView";
import { useAnalysis } from "./hooks/useAnalysis";
import type { AnalysisResult } from "./types/analysis";

function App() {
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
	const [timeRange, setTimeRange] = useState<"today" | "last-week">("today");
	const { startAnalysis, status, result, message, loadFromFile, saveToFile, processedCount, totalCount } = useAnalysis();


	const handleStartAnalysis = () => {
		startAnalysis(selectedTopic, timeRange === "last-week");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
			{/* Header with visual background */}
			<header className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-indigo-900/30 sticky top-0 z-10 relative overflow-hidden">
				<div className="absolute inset-0 opacity-10">
					<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
						<defs>
							<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
								<path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />
					</svg>
				</div>
				<div className="container mx-auto px-4 py-4 flex items-center space-x-4 relative">
					<div className="bg-indigo-600 p-2 rounded-lg shadow-lg h-12 w-12 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-8 w-8 text-white"
						>
							<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
							<path d="M18 14h-8"></path>
							<path d="M18 10h-8"></path>
							<path d="M18 6h-8"></path>
						</svg>
					</div>
					<h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-200">Brutalist Report Analyzer</h1>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 flex flex-col gap-8">
				{/* Controls Section */}
				<section className="bg-gray-800/70 rounded-xl p-6 shadow-lg border border-gray-700/50 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 text-indigo-500/10">
						<BarChart2 size={128} />
					</div>
					<div className="relative">
						<div className="flex items-center mb-4 gap-2">
							<h2 className="text-xl font-semibold text-indigo-200">Analysis Configuration</h2>
							<span className="bg-indigo-900/60 text-indigo-200 text-xs px-2 py-0.5 rounded-full">Step 1: Configure</span>
						</div>

						<TopicSelector
							selectedTopic={selectedTopic}
							onSelectTopic={setSelectedTopic}
							timeRange={timeRange}
							onSelectTimeRange={setTimeRange}
							onStartAnalysis={handleStartAnalysis}
							isLoading={status === "loading"}
						/>
					</div>
				</section>

				{/* Status Section */}
				{(status !== "idle" || result) && (
					<section className="bg-gray-800/70 rounded-xl p-6 shadow-lg border border-gray-700/50 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 text-indigo-500/10">
							<TrendingUp size={128} />
						</div>
						<div className="relative">
							<div className="flex items-center mb-4 gap-2">
								<h2 className="text-xl font-semibold text-indigo-200">Status</h2>
								<span className="bg-indigo-900/60 text-indigo-200 text-xs px-2 py-0.5 rounded-full">Step 2: Processing</span>
							</div>

							<JobStatus status={status} message={message} processedCount={processedCount} totalCount={totalCount} />
						</div>
					</section>
				)}

				{/* Results Section */}
				{result && (
					<section className="bg-gray-800/70 rounded-xl p-6 shadow-lg border border-gray-700/50 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 text-indigo-500/10">
							<Globe size={128} />
						</div>
						<div className="relative">
							<div className="flex items-center mb-4 gap-2">
								<h2 className="text-xl font-semibold text-indigo-200">Results</h2>
								<span className="bg-indigo-900/60 text-indigo-200 text-xs px-2 py-0.5 rounded-full">Step 3: View Analysis</span>
							</div>

							<ResultsView result={result as AnalysisResult} onSaveResults={saveToFile} onLoadResults={loadFromFile} />
						</div>
					</section>
				)}
			</main>

			{/* Footer */}
			<footer className="bg-gray-800/80 mt-auto py-4 border-t border-indigo-900/30">
				<div className="container mx-auto px-4 text-center text-indigo-300 text-sm">© 2025 Brutalist Report Analyzer • Data sourced from brutalist.report</div>
			</footer>
		</div>
	);
}

export default App;
