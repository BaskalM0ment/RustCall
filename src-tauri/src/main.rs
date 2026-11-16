#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::header::{AUTHORIZATION, USER_AGENT};
use serde::Serialize;
use std::env;

const API: &str = "https://discord.com/api/v10";

#[derive(Serialize)]
struct Channel {
    id: String,
    name: String,
    kind: u8,
}

fn token() -> Result<String, String> {
    if env::var("DISCORD_BOT_TOKEN").is_err() {
        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        for path in [manifest.join(".env"), manifest.join("../.env")] {
            if path.exists() {
                let _ = dotenvy::from_path(path);
                break;
            }
        }
    }

    env::var("DISCORD_BOT_TOKEN")
        .map(|value| value.trim().to_string())
        .map_err(|_| "Missing DISCORD_BOT_TOKEN. Create a .env file in the project root.".to_string())
}

async fn discord_get(path: &str) -> Result<serde_json::Value, String> {
    let bot_token = token()?;
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{API}{path}"))
        .header(AUTHORIZATION, format!("Bot {bot_token}"))
        .header(USER_AGENT, "RustCall/0.1 (Windows desktop app)")
        .send()
        .await
        .map_err(|error| format!("Network error: {error}"))?;

    let status = response.status();
    let body = response.text().await.map_err(|error| error.to_string())?;
    if !status.is_success() {
        return Err(format!("Discord returned HTTP {status}: {body}"));
    }

    serde_json::from_str(&body).map_err(|error| format!("Invalid Discord response: {error}"))
}

#[tauri::command]
async fn check_connection() -> Result<(), String> {
    let _ = discord_get("/users/@me").await?;
    Ok(())
}

#[tauri::command]
async fn get_channels(guild_id: String) -> Result<Vec<Channel>, String> {
    if !guild_id.chars().all(|character| character.is_ascii_digit())
        || !(17..=20).contains(&guild_id.len())
    {
        return Err("Invalid Discord server ID.".into());
    }

    let value = discord_get(&format!("/guilds/{guild_id}/channels")).await?;
    let items = value.as_array().ok_or("Unexpected channel response")?;

    Ok(items
        .iter()
        .filter_map(|channel| {
            Some(Channel {
                id: channel["id"].as_str()?.to_string(),
                name: channel["name"].as_str().unwrap_or("unnamed").to_string(),
                kind: channel["type"].as_u64().unwrap_or(255) as u8,
            })
        })
        .collect())
}

#[tauri::command]
async fn send_message(channel_id: String, content: String) -> Result<(), String> {
    if !channel_id.chars().all(|character| character.is_ascii_digit())
        || !(17..=20).contains(&channel_id.len())
    {
        return Err("Invalid Discord channel ID.".into());
    }

    let message = content.trim();
    if message.is_empty() {
        return Err("Message cannot be empty.".into());
    }
    if message.chars().count() > 2000 {
        return Err("Discord messages have a 2,000 character limit.".into());
    }

    let bot_token = token()?;
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{API}/channels/{channel_id}/messages"))
        .header(AUTHORIZATION, format!("Bot {bot_token}"))
        .header(USER_AGENT, "RustCall/0.1 (Windows desktop app)")
        .json(&serde_json::json!({ "content": message }))
        .send()
        .await
        .map_err(|error| format!("Network error: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Discord returned HTTP {status}: {body}"));
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_connection,
            get_channels,
            send_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running RustCall");
}
