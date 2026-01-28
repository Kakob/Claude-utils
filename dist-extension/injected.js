const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  const response = await originalFetch.call(this, input, init);
  try {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("claude.ai/api/")) {
      const tokens = extractTokenHeaders(response.headers);
      const model = response.headers.get("x-model") ?? void 0;
      const conversationMatch = url.match(/\/(?:chat_)?conversations\/([a-f0-9-]+)/);
      const conversationId = conversationMatch?.[1];
      if (url.includes("/completion") && init?.method === "POST") {
        const clonedResponse = response.clone();
        let requestModel;
        let userMessage;
        if (init?.body) {
          try {
            const bodyStr = typeof init.body === "string" ? init.body : new TextDecoder().decode(init.body);
            const bodyJson = JSON.parse(bodyStr);
            requestModel = bodyJson.model;
            if (bodyJson.prompt) {
              userMessage = bodyJson.prompt;
            } else if (bodyJson.messages && Array.isArray(bodyJson.messages)) {
              const userMessages = bodyJson.messages.filter((m) => m.role === "user");
              const lastUserMsg = userMessages[userMessages.length - 1];
              if (lastUserMsg) {
                if (typeof lastUserMsg.content === "string") {
                  userMessage = lastUserMsg.content;
                } else if (Array.isArray(lastUserMsg.content)) {
                  userMessage = lastUserMsg.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
                }
              }
            }
          } catch {
          }
        }
        processStreamingResponse(clonedResponse, {
          url,
          method: init?.method ?? "POST",
          status: response.status,
          tokens: tokens ?? void 0,
          model: model || requestModel,
          conversationId,
          userMessage,
          timestamp: Date.now()
        });
      } else {
        const capturedData = {
          url,
          method: init?.method ?? "GET",
          status: response.status,
          tokens: tokens ?? void 0,
          model,
          conversationId,
          timestamp: Date.now()
        };
        console.log("[Claude Utils] Captured API call:", url, capturedData);
        window.dispatchEvent(
          new CustomEvent("claude-utils-response", {
            detail: capturedData
          })
        );
      }
    }
  } catch (e) {
    console.error("[Claude Utils] Error intercepting fetch:", e);
  }
  return response;
};
async function processStreamingResponse(response, baseData) {
  try {
    const reader = response.body?.getReader();
    if (!reader) {
      window.dispatchEvent(
        new CustomEvent("claude-utils-response", { detail: baseData })
      );
      return;
    }
    const decoder = new TextDecoder();
    let fullText = "";
    let extractedTokens;
    let extractedModel;
    let inputTokens = 0;
    let outputTokens = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
    }
    const lines = fullText.split("\n");
    let messageContent = "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "content_block_delta" && data.delta?.text) {
            messageContent += data.delta.text;
          }
          if (data.completion) {
            messageContent = data.completion;
          }
          if (data.type === "message_start" && data.message) {
            if (data.message.model && data.message.model.length > 0) {
              extractedModel = data.message.model;
            }
            if (data.message.usage?.input_tokens) {
              inputTokens = data.message.usage.input_tokens;
            }
          }
          if (data.type === "message_delta" && data.usage?.output_tokens) {
            outputTokens = data.usage.output_tokens;
          }
          if (data.usage) {
            if (data.usage.input_tokens) inputTokens = data.usage.input_tokens;
            if (data.usage.output_tokens) outputTokens = data.usage.output_tokens;
          }
          if (data.model && !extractedModel) {
            extractedModel = data.model;
          }
        } catch {
        }
      }
    }
    if (inputTokens > 0 || outputTokens > 0) {
      extractedTokens = { inputTokens, outputTokens };
    }
    const messagePreview = messageContent.slice(0, 200) + (messageContent.length > 200 ? "..." : "");
    const capturedData = {
      ...baseData,
      tokens: extractedTokens ?? baseData.tokens,
      model: extractedModel ?? baseData.model,
      messagePreview: messagePreview || void 0,
      fullContent: messageContent || void 0,
      userMessage: baseData.userMessage
    };
    console.log("[Claude Utils] Captured completion:", capturedData.model, {
      userMsgLen: baseData.userMessage?.length ?? 0,
      responseMsgLen: messageContent.length
    });
    window.dispatchEvent(
      new CustomEvent("claude-utils-response", {
        detail: capturedData
      })
    );
  } catch (e) {
    console.error("[Claude Utils] Error processing streaming response:", e);
    window.dispatchEvent(
      new CustomEvent("claude-utils-response", {
        detail: baseData
      })
    );
  }
}
function extractTokenHeaders(headers) {
  const inputTokens = headers.get("anthropic-input-tokens");
  const outputTokens = headers.get("anthropic-output-tokens");
  if (!inputTokens || !outputTokens) {
    return null;
  }
  const result = {
    inputTokens: parseInt(inputTokens, 10),
    outputTokens: parseInt(outputTokens, 10)
  };
  const cacheCreation = headers.get("anthropic-cache-creation-input-tokens");
  const cacheRead = headers.get("anthropic-cache-read-input-tokens");
  if (cacheCreation) {
    result.cacheCreationTokens = parseInt(cacheCreation, 10);
  }
  if (cacheRead) {
    result.cacheReadTokens = parseInt(cacheRead, 10);
  }
  return result;
}
console.log("[Claude Utils] Fetch interceptor loaded");
//# sourceMappingURL=injected.js.map
