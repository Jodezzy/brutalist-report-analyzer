// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::command;

#[command]
fn run_python_script(topic: Option<String>, last_week: bool) -> Result<String, String> {
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
    
    // Execute Python script
    match Command::new(python_cmd)
        .args(&cmd_args)
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                Ok(stdout)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                Err(format!("Python script failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute Python script: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_python_script])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}