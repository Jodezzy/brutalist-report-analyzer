// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use tauri::{command};

#[command]
async fn run_python_script(window: tauri::Window, topic: Option<String>, last_week: bool) -> Result<(), String> {
    let mut cmd_args = vec!["brutalist_report.py".to_string()];
    
    // Add topic if provided
    if let Some(topic_val) = topic {
        cmd_args.push("--topic".to_string());
        cmd_args.push(topic_val);
    }
    
    // Add last_week flag if true
    if last_week {
        cmd_args.push("--last-week".to_string());
    }
    
    // For debugging
    println!("Running command: python {:?}", cmd_args);
    
    // Determine Python command based on platform
    let python_cmd = if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    };
    
    // Execute Python script with piped output
    let mut child = Command::new(python_cmd)
        .args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    // Get stdout handle
    let stdout = child.stdout.take()
        .ok_or_else(|| "Failed to capture stdout".to_string())?;
    
    // Create a buffered reader
    let reader = BufReader::new(stdout);
    
    // Read output line by line and emit events
    for line in reader.lines() {
        match line {
            Ok(line) => {
                if !line.trim().is_empty() {
                    println!("Python output: {}", line); // Debug log
                    window.emit("python-output", line)
                        .map_err(|e| format!("Failed to emit event: {}", e))?;
                }
            }
            Err(e) => {
                return Err(format!("Error reading Python output: {}", e));
            }
        }
    }

    // Wait for the process to complete
    let status = child.wait()
        .map_err(|e| format!("Error waiting for Python process: {}", e))?;

    if !status.success() {
        return Err("Python script failed".to_string());
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_python_script])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}