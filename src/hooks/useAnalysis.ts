import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/api/dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import type { AnalysisResult } from "../types/analysis";

export function useAnalysis() {
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [progress, setProgress] = useState(0);
	const [message, setMessage] = useState("");
	const [result, setResult] = useState<AnalysisResult | null>(null);
	const [processedCount, setProcessedCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		console.log("Setting up Python output listener"); // Debug log
		
		// Set up event listener for Python output
		const unlisten = listen<string>("python-output", (event) => {
			console.log("Received Python output:", event.payload); // Debug log
			
			try {
				const data = JSON.parse(event.payload);
				console.log("Parsed data:", data); // Debug log

				if (data.status === "progress" && data.processed !== undefined && data.total !== undefined) {
					console.log("Updating progress:", data.processed, data.total); // Debug log
					setProcessedCount(data.processed);
					setTotalCount(data.total);
					setProgress(Math.round((data.processed / data.total) * 100));
					if (data.message) {
						setMessage(data.message);
					}
				} else if (data.status === "error") {
					setMessage(data.message);
					setStatus("error");
				} else if (!data.status) {
					// This is the final result
					setResult(data);
					setProgress(100);
					setMessage("Analysis completed successfully");
					setStatus("success");
				}
			} catch (parseError) {
				console.warn("Failed to parse Python output:", event.payload, parseError);
			}
		});

		// Cleanup listener on unmount
		return () => {
			console.log("Cleaning up Python output listener"); // Debug log
			unlisten.then(fn => fn());
		};
	}, []);

	const startAnalysis = async (topic: string | null, lastWeek: boolean) => {
		try {
			console.log("Starting analysis..."); // Debug log
			setStatus("loading");
			setProgress(0);
			setMessage("Starting analysis...");
			setProcessedCount(0);
			setTotalCount(0);

			await invoke("run_python_script", {
				topic: topic || null,
				lastWeek,
			});
		} catch (error) {
			console.error("Error running analysis:", error);
			setMessage(`Error running analysis: ${String(error)}`);
			setStatus("error");
		}
	};

	const saveToFile = async () => {
		if (!result) return;

		try {
			const savePath = await save({
				filters: [
					{
						name: "JSON",
						extensions: ["json"],
					},
				],
				defaultPath: `brutalist_report_${result.is_last_week ? "last_week" : "today"}_${result.topic || "all"}_${result.date}.json`,
			});

			if (savePath) {
				await writeTextFile(savePath, JSON.stringify(result, null, 2));
				setMessage(`Results saved to ${savePath}`);
			}
		} catch (error) {
			console.error("Error saving file:", error);
			setMessage(`Error saving file: ${String(error)}`);
		}
	};

	const loadFromFile = async () => {
		try {
			const selected = await open({
				filters: [
					{
						name: "JSON",
						extensions: ["json"],
					},
				],
			});

			if (selected && typeof selected === "string") {
				const content = await readTextFile(selected);
				const data = JSON.parse(content) as AnalysisResult;
				setResult(data);
				setStatus("success");
				setProgress(100);
				setMessage(`Loaded results from ${selected}`);
			}
		} catch (error) {
			console.error("Error loading file:", error);
			setMessage(`Error loading file: ${String(error)}`);
			setStatus("error");
		}
	};

	return {
		startAnalysis,
		saveToFile,
		loadFromFile,
		status,
		progress,
		message,
		result,
		processedCount,
		totalCount,
	};
}
