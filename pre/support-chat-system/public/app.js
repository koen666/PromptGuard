const conversation = document.querySelector("#conversation");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const modeButtons = Array.from(document.querySelectorAll(".mode"));
const sampleButtons = Array.from(document.querySelectorAll("[data-sample]"));

const promptName = document.querySelector("#promptName");
const promptVersion = document.querySelector("#promptVersion");
const routeState = document.querySelector("#routeState");
const blockedState = document.querySelector("#blockedState");
const apiCallState = document.querySelector("#apiCallState");
const pmSentState = document.querySelector("#pmSentState");
const providerState = document.querySelector("#providerState");
const modelState = document.querySelector("#modelState");
const findingCount = document.querySelector("#findingCount");
const findings = document.querySelector("#findings");
const exposure = document.querySelector("#exposure");

let currentMode = "direct";

boot();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  await sendMessage(message);
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentMode = button.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle("active", item === button));
    addAssistantNote(modeDescription(currentMode));
  });
});

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.sample;
    input.focus();
  });
});

async function boot() {
  try {
    const state = await fetchJson("/api/state");
    promptName.textContent = state.prompt.name;
    promptVersion.textContent = `v${state.prompt.versionNumber}`;
    routeState.textContent = `${state.prompt.route.status}/${state.prompt.route.selected}`;
    addAssistantNote("这个小项目只做两种对照：直接调用模型会把 PM 当普通变量拼进 messages；使用 PromptGuard SDK 会从资产库加载并自动加防护。建议先用“直接调用模型”发提示词逆向样例，再切到 SDK 模式对比。");
  } catch (error) {
    addAssistantNote(`启动失败：${error.message}`, true);
  }
}

async function sendMessage(message) {
  const mode = currentMode;
  appendMessage("user", message, false, { mode });
  sendButton.disabled = true;
  sendButton.textContent = "处理中";

  try {
    const result = await fetchJson("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode }),
    });
    const assistantMessage = appendMessage("assistant", "", result.blocked, { mode });
    if (shouldTypeResult(result)) {
      assistantMessage.node.classList.add("typing");
      await typeMessage(assistantMessage.body, result.output);
      assistantMessage.node.classList.remove("typing");
    } else {
      assistantMessage.body.textContent = result.output;
    }
    updateInspector(result);
  } catch (error) {
    appendMessage("assistant", `请求失败：${error.message}`, true, { mode });
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "发送";
  }
}

function appendMessage(role, content, blocked = false, options = {}) {
  const node = document.createElement("div");
  node.className = `message ${role}${blocked ? " blocked" : ""}`;
  const label = role === "user" ? "User" : blocked ? "PromptGuard" : "Assistant";
  const labelNode = document.createElement("small");
  labelNode.textContent = `${label} · ${options.mode || currentMode}`;
  const bodyNode = document.createElement("div");
  bodyNode.className = "message-body";
  bodyNode.textContent = content;
  node.append(labelNode, bodyNode);
  conversation.appendChild(node);
  conversation.scrollTop = conversation.scrollHeight;
  return { node, body: bodyNode };
}

function addAssistantNote(content, blocked = false) {
  appendMessage("assistant", content, blocked);
}

function updateInspector(result) {
  blockedState.textContent = result.blocked ? "yes" : "no";
  blockedState.style.color = result.blocked ? "var(--red)" : "var(--green)";
  apiCallState.textContent = formatCallState(result);
  apiCallState.style.color = result.realCall
    ? "var(--green)"
    : result.callState === "leak" || result.callState === "blocked"
      ? "var(--gold)"
      : "var(--red)";
  pmSentState.textContent = result.exposure?.sentSystemPrompt ? "yes" : "no";
  pmSentState.style.color = result.exposure?.sentSystemPrompt ? "var(--red)" : "var(--green)";
  providerState.textContent = result.provider || "-";
  modelState.textContent = result.model || "-";
  findingCount.textContent = String(result.findings?.length ?? 0);
  updateExposure(result.exposure);

  if (!result.findings?.length) {
    findings.className = "findings empty";
    findings.textContent = "本次没有 finding。";
    return;
  }

  findings.className = "findings";
  findings.innerHTML = result.findings.map((finding) => `
    <article class="finding">
      <header>
        <b>${escapeHtml(finding.name)}</b>
        <span>${escapeHtml(finding.level)}</span>
      </header>
      <p>${escapeHtml(finding.description)}</p>
      <p>Evidence: ${escapeHtml(finding.evidence || "-")}</p>
      <p>${escapeHtml(finding.recommendation || "")}</p>
    </article>
  `).join("");
}

function updateExposure(exposureInfo) {
  if (!exposureInfo) {
    exposure.className = "exposure empty";
    exposure.textContent = "本次没有 PM 暴露信息。";
    return;
  }

  exposure.className = "exposure";
  const preview = exposureInfo.preview
    ? `<pre>${escapeHtml(exposureInfo.preview)}</pre>`
    : "";
  exposure.innerHTML = `
    <p>${escapeHtml(exposureInfo.description)}</p>
    ${preview}
  `;
}

function shouldTypeResult(result) {
  return result.mode === "direct" && result.callState === "leak";
}

function typeMessage(target, content) {
  const text = String(content);
  const step = text.length > 420 ? 2 : 1;
  const delayMs = text.length > 420 ? 12 : 18;
  let index = 0;
  target.textContent = "";

  return new Promise((resolve) => {
    const tick = () => {
      index = Math.min(text.length, index + step);
      target.textContent = text.slice(0, index);
      conversation.scrollTop = conversation.scrollHeight;
      if (index >= text.length) {
        resolve();
        return;
      }
      window.setTimeout(tick, delayMs + Math.floor(Math.random() * 8));
    };
    window.setTimeout(tick, 420);
  });
}

function formatCallState(result) {
  if (result.callState === "leak") return "leak";
  if (result.callState === "blocked") return "blocked";
  return result.realCall ? "real" : "no";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function modeDescription(mode) {
  if (mode === "sdk") return "使用 PromptGuard SDK：业务系统加载 Prompt 资产，SDK 在模型调用前后防止 PM 泄漏。";
  return "直接调用模型：业务代码把 PM 放在 systemPrompt 变量里再拼进 messages，攻击时容易被套出。";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
