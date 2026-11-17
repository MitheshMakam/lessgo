const { GoogleGenerativeAI } = require("@google/generative-ai");

let client = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to backend/.env."
    );
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

/**
 * Convert OpenAI-style messages into Gemini format.
 *
 * Gemini:
 * - system -> systemInstruction
 * - user -> user
 * - assistant -> model
 */
function toGeminiFormat(messages) {
  const systemMessages = messages.filter(
    (message) => message.role === "system"
  );

  const conversationMessages = messages.filter(
    (message) => message.role !== "system"
  );

  const systemInstruction = systemMessages
    .map((message) => message.content)
    .join("\n\n");

  // Gemini history must contain previous messages only.
  const conversation = conversationMessages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content) }],
  }));

  // Gemini chat history must start with a user turn. LessGo interviews start
  // with the assistant's opening question, so add a neutral opening turn while
  // preserving the actual question and every subsequent transcript message.
  if (conversation[0]?.role === "model") {
    conversation.unshift({ role: "user", parts: [{ text: "Begin the interview." }] });
  }

  const lastMessage = conversation[conversation.length - 1];
  let history;
  let lastUserText;

  if (lastMessage?.role === "model") {
    // A completed interview transcript ends with the assistant's last question.
    // Keep it in history and send a separate user instruction as the new turn.
    history = conversation;
    lastUserText = "Continue using the system instructions and review the conversation so far.";
  } else if (lastMessage) {
    history = conversation.slice(0, -1);
    lastUserText = lastMessage.parts.map((part) => part.text || "").join("\n");
  } else {
    history = [];
    lastUserText = "Ask the opening interview question now.";
  }

  return {
    systemInstruction,
    history,
    lastUserText,
  };
}

/**
 * Chat completion using Gemini.
 */
async function chatComplete(messages, options = {}) {
  try {
    const genAI = getClient();

    const {
      systemInstruction,
      history,
      lastUserText,
    } = toGeminiFormat(messages);

    const modelName =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const model = genAI.getGenerativeModel({
      model: modelName,

      ...(systemInstruction
        ? {
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
          }
        : {}),

      generationConfig: {
        temperature: options.temperature ?? 0.7,

        ...(options.json
          ? {
              responseMimeType: "application/json",
            }
          : {}),
      },
    });

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(lastUserText);

    const text = result?.response?.text?.();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text.trim();
  } catch (err) {
    console.error("Gemini error:", err);

    const message = err?.message || "";

    if (
      message.includes("API key not valid") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("invalid API key")
    ) {
      throw new Error(
        "Gemini API key is invalid. Check GEMINI_API_KEY in backend/.env."
      );
    }

    if (
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit")
    ) {
      throw new Error(
        "Gemini API quota/rate limit reached. Please wait and try again."
      );
    }

    if (
      message.includes("404") ||
      message.toLowerCase().includes("not found")
    ) {
      throw new Error(
        `Gemini model "${process.env.GEMINI_MODEL || "gemini-2.5-flash"}" was not found. Check GEMINI_MODEL.`
      );
    }

    throw new Error(
      `Gemini request failed: ${message || "Unknown AI service error"}`
    );
  }
}

/**
 * Chat completion that expects JSON.
 */
async function chatCompleteJSON(messages, options = {}) {
  const raw = await chatComplete(messages, {
    ...options,
    json: true,
  });

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid Gemini JSON:", raw);

    throw new Error(
      "AI service returned an unexpected response format. Please try again."
    );
  }
}

module.exports = {
  chatComplete,
  chatCompleteJSON,
};
