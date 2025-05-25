"use client";

import type React from "react";
import { useMemo } from "react";
import type { AnalysisResult } from "../types/analysis";

interface WordCloudProps {
	result: AnalysisResult;
}

const WordCloud: React.FC<WordCloudProps> = ({ result }) => {
	const wordFrequency = useMemo(() => {
		const words: Record<string, number> = {};
		const stopWords = new Set([
			"the",
			"a",
			"an",
			"and",
			"or",
			"but",
			"in",
			"on",
			"at",
			"to",
			"for",
			"of",
			"with",
			"by",
			"is",
			"are",
			"was",
			"were",
			"be",
			"been",
			"have",
			"has",
			"had",
			"do",
			"does",
			"did",
			"will",
			"would",
			"could",
			"should",
			"may",
			"might",
			"can",
			"must",
			"shall",
			"this",
			"that",
			"these",
			"those",
			"i",
			"you",
			"he",
			"she",
			"it",
			"we",
			"they",
			"me",
			"him",
			"her",
			"us",
			"them",
			"my",
			"your",
			"his",
			"her",
			"its",
			"our",
			"their",
			"from",
			"up",
			"about",
			"into",
			"over",
			"after",
			"as",
			"how",
			"what",
			"when",
			"where",
			"who",
			"why",
			"which",
			"than",
			"so",
			"very",
			"just",
			"now",
			"then",
			"here",
			"there",
			"more",
			"most",
			"much",
			"many",
			"some",
			"any",
			"all",
			"no",
			"not",
			"only",
			"other",
			"new",
			"old",
			"first",
			"last",
			"long",
			"great",
			"little",
			"own",
			"right",
			"big",
			"high",
			"different",
			"small",
			"large",
			"next",
			"early",
			"young",
			"important",
			"few",
			"public",
			"bad",
			"same",
			"able",
		]);

		// Extract words from all headlines
		result.common_topics.forEach((topic) => {
			topic.headlines.forEach((headline) => {
				const words_in_title = headline.title
					.toLowerCase()
					.replace(/[^\w\s]/g, " ")
					.split(/\s+/)
					.filter((word) => word.length > 3 && !stopWords.has(word));

				words_in_title.forEach((word) => {
					words[word] = (words[word] || 0) + 1;
				});
			});
		});

		// Sort by frequency and take top 50
		return Object.entries(words)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 50)
			.map(([word, count]) => ({ word, count }));
	}, [result]);

	const maxCount = Math.max(...wordFrequency.map((w) => w.count));

	return (
		<div className="bg-gray-700/80 rounded-xl p-5 border border-gray-600/50">
			<h3 className="text-lg font-medium text-indigo-200 mb-4">Word Cloud</h3>
			<div className="flex flex-wrap gap-2 justify-center">
				{wordFrequency.map(({ word, count }) => {
					const size = Math.max(12, Math.min(32, (count / maxCount) * 24 + 12));
					const opacity = Math.max(0.4, count / maxCount);

					return (
						<span
							key={word}
							className="text-indigo-300 hover:text-indigo-100 transition-colors cursor-default"
							style={{
								fontSize: `${size}px`,
								opacity: opacity,
								fontWeight: count > maxCount * 0.7 ? "bold" : "normal",
							}}
							title={`${word}: ${count} occurrences`}
						>
							{word}
						</span>
					);
				})}
			</div>
		</div>
	);
};

export default WordCloud;
