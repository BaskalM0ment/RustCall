import { invoke } from "@tauri-apps/api/core";
import "./style.css";

const app = document.querySelector("#app");
app.innerHTML = `
<div class="shell">
  <aside class="rail">
    <div class="brand">R<span>C</span></div>
    <div class="rail-icon active">⌂</div>
    <div class="rail-icon">✉</div>
    <div class="rail-bottom">⚙</div>
  </aside>
  <aside class="servers">
    <div class="side-title">SERVERS</div>
    <div class="server-list">
      <label class="guild-label" for="guild-id">SERVER ID</label>
      <input id="guild-id" class="guild-input" placeholder="Paste server ID">
      <button id="load-server" class="load-server">Load server</button>
      <p class="muted pad">The bot must already be invited to this server.</p>
    </div>
    <div class="connection"><span class="dot"></span><div><b id="connection-state">Not connected</b><small>Discord bot connection</small></div></div>
  </aside>
  <main class="main">
    <header class="topbar">
      <div><div class="eyebrow">RUSTCALL / DISCORD</div><h1 id="page-title">Messages</h1></div>
      <button id="connect" class="primary">Connect bot</button>
    </header>
    <section id="welcome" class="welcome">
      <div class="hero-icon">⌁</div>
      <h2>Your Discord, simplified.</h2>
      <p>Connect a Discord bot to browse its servers and send messages without opening the Discord desktop app.</p>
      <button id="connect-large" class="primary">Connect Discord bot</button>
      <p class="fine">Uses an official Discord bot account. It does not log in as your personal user.</p>
    </section>
    <section id="workspace" class="workspace hidden">
      <div class="channel-pane">
        <div class="pane-heading">TEXT CHANNELS</div>
        <div id="channel-list" class="channel-list"></div>
      </div>
      <div class="chat-pane">
        <div class="chat-head"><div><div class="eyebrow">CHANNEL</div><h2 id="channel-title">Select a channel</h2></div><span class="pill">BOT MESSAGING</span></div>
        <div id="messages" class="messages">
          <div class="empty-chat">Select a text channel to start composing.</div>
        </div>
        <form id="send-form" class="composer">
          <input id="message-input" maxlength="2000" placeholder="Message this channel..." autocomplete="off" disabled>
          <button class="send" type="submit" disabled>Send ↑</button>
        </form>
      </div>
    </section>
    <div id="toast" class="toast"></div>
  </main>
</div>`;

const $ = (id) => document.getElementById(id);
let selectedChannel = null;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 3200);
}

function setConnected(connected) {
  $("connection-state").textContent = connected ? "Bot connected" : "Not connected";
  $("welcome").classList.toggle("hidden", connected);
  $("workspace").classList.toggle("hidden", !connected);
  $("connect").textContent = connected ? "Check connection" : "Connect bot";
  document.querySelector(".dot").classList.toggle("online", connected);
}

async function connect() {
  try {
    $("connect").disabled = true;
    $("connect").textContent = "Checking...";
    await invoke("check_connection");
    setConnected(true);
    toast("Bot token accepted. Enter a server ID to load channels.");
  } catch (error) {
    setConnected(false);
    toast(String(error));
  } finally {
    $("connect").disabled = false;
  }
}

async function loadChannels(guildId, guildName) {
  $("page-title").textContent = guildName;
  $("channel-list").innerHTML = '<div class="muted pad">Loading channels...</div>';
  try {
    const channels = await invoke("get_channels", { guildId });
    $("channel-list").innerHTML = "";
    const textChannels = channels.filter(channel => channel.kind === 0);
    if (!textChannels.length) {
      $("channel-list").innerHTML = '<div class="muted pad">No accessible text channels.</div>';
    }
    textChannels.forEach(channel => {
      const element = document.createElement("button");
      element.className = "channel-item";
      element.textContent = "#  " + channel.name;
      element.onclick = () => selectChannel(channel, element);
      $("channel-list").append(element);
    });
  } catch (error) {
    $("channel-list").innerHTML = "";
    toast(String(error));
  }
}

function selectChannel(channel, button) {
  selectedChannel = channel.id;
  document.querySelectorAll(".channel-item").forEach(element => element.classList.remove("selected"));
  button.classList.add("selected");
  $("channel-title").textContent = "# " + channel.name;
  $("messages").innerHTML = '<div class="empty-chat">Messages sent from RustCall will appear in Discord.</div>';
  $("message-input").disabled = false;
  document.querySelector(".send").disabled = false;
  $("message-input").focus();
}

$("connect").onclick = connect;
$("connect-large").onclick = connect;

$("load-server").onclick = () => {
  const id = $("guild-id").value.trim();
  if (!/^\d{17,20}$/.test(id)) {
    toast("Enter a valid Discord server ID.");
    return;
  }
  loadChannels(id, "Server " + id);
};

$("send-form").addEventListener("submit", async event => {
  event.preventDefault();
  const content = $("message-input").value.trim();
  if (!content || !selectedChannel) return;

  const button = document.querySelector(".send");
  button.disabled = true;
  try {
    await invoke("send_message", { channelId: selectedChannel, content });
    const line = document.createElement("div");
    line.className = "sent-message";
    const label = document.createElement("b");
    label.textContent = "RustCall bot";
    const body = document.createElement("p");
    body.textContent = content;
    line.append(label, body);
    $("messages").append(line);
    $("messages").scrollTop = $("messages").scrollHeight;
    $("message-input").value = "";
  } catch (error) {
    toast(String(error));
  } finally {
    button.disabled = false;
  }
});
