# RustCall for Windows

RustCall is a lightweight Windows desktop companion for Discord, built with Tauri 2, Rust, and JavaScript.

## Current scope

- Connects using an official Discord bot token.
- Loads text channels from a server by server ID.
- Sends messages as the bot.
- Runs as a standalone Windows desktop app. The Discord desktop app does not need to be open.

## Discord limitations

RustCall does not sign in as a normal Discord user. Discord does not provide a supported API for third-party clients to join personal user calls or impersonate user accounts. Do not use self-bots or personal user tokens.

Voice calls are not implemented yet. A Discord bot can join eligible server voice channels as a separate bot participant, which is different from joining a personal Discord call.

## Quick install

1. Download or clone this repository.
2. Right-click `install.bat` and choose **Run as administrator**.
3. Follow the prompts and paste your Discord bot token when asked.
4. When installation finishes, double-click `start.bat`.

The installer checks for Node.js, Rust, and the Microsoft C++ build tools, installs missing prerequisites using WinGet, installs npm packages, and builds the Windows app.

### Manual install

Requirements:
- Windows 10/11
- Node.js LTS
- Rust stable
- Visual Studio 2022 Build Tools with **Desktop development with C++**
- WebView2 Runtime

Then run:

```powershell
npm install
npm run tauri dev
npm run tauri build
```

## Create a Discord bot

1. Open https://discord.com/developers/applications
2. Create an application and add a bot.
3. Copy the bot token. Keep it private.
4. Under OAuth2 URL Generator, select the `bot` scope.
5. Grant `View Channels` and `Send Messages`.
6. Invite the bot to a server you manage.
7. Enable Developer Mode in Discord under User Settings > Advanced.
8. Right-click the server icon and choose **Copy Server ID**.

RustCall asks for the bot token during installation and stores it in the local `.env` file. The `.env` file is excluded from Git.

## Security

- Never share your bot token.
- Never commit `.env`.
- If a token leaks, reset it immediately in the Discord Developer Portal.
- Messages are sent as the bot, not as your personal Discord account.

## Current feature status

| Feature | Status |
|---|---|
| Windows desktop shell | Implemented |
| Rust backend | Implemented |
| Bot token check | Implemented |
| Load server text channels | Implemented |
| Send messages | Implemented |
| Receive live messages | Not implemented |
| Voice channels/calls | Not implemented |
| Friends and presence | Not implemented |
