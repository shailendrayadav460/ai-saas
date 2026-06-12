const OpenAI = require('openai');
const tools = require('../agents/tools');
const { executeToolCall } = require('../agents/executor');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an intelligent AI assistant integrated into a SaaS platform. You have access to the user's Google services (Gmail, Calendar, Drive, Docs, Sheets) and can send WhatsApp messages.

When users ask you to perform actions, use the appropriate tools:
- To send emails → use send_email
- To schedule meetings/events → use create_calendar_event or create_google_meet
- To manage files → use list_drive_files or upload_to_drive
- To create spreadsheets → use create_spreadsheet
- To create documents → use create_google_doc
- To send WhatsApp messages → use send_whatsapp_message

Always confirm what action you took after executing a tool. Be friendly, concise, and helpful.
For dates/times, always convert natural language ("tomorrow at 5 PM") to proper ISO 8601 format before calling tools.
Current date context: ${new Date().toISOString()}`;

/**
 * Send a message to the AI and get a response (with tool execution)
 * @param {Array} messages - Conversation history
 * @param {string} userId - Current user ID
 * @returns {object} { reply, toolsUsed }
 */
const chat = async (messages, userId) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key_here')) {
    return {
      reply: "⚠️ **OpenAI API Key Not Configured**\n\nHello! I am your AI Workspace Assistant. It looks like your OpenAI API Key is not set up yet in `backend/.env`.\n\nTo unlock the full power of this platform (including sending emails, creating calendar events, managing Drive files, generating spreadsheets/documents, and sending WhatsApp messages), please set a valid `OPENAI_API_KEY` in your backend environment variables and restart the server.",
      toolsUsed: []
    };
  }

  const conversationMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  const toolsUsed = [];
  let currentMessages = [...conversationMessages];

  // Agentic loop — keep calling until no more tool calls
  while (true) {
    let response;
    try {
      response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: currentMessages,
        tools,
        tool_choice: 'auto',
        max_tokens: 2000,
      });
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error.status === 401) {
        return {
          reply: "⚠️ **OpenAI Authentication Failed**\n\nThe OpenAI API key provided in the `backend/.env` file is invalid or expired. Please check your credentials at https://platform.openai.com/api-keys and make sure it has sufficient credits.",
          toolsUsed: []
        };
      }
      return {
        reply: `❌ **Error communicating with OpenAI**:\n\n${error.message}`,
        toolsUsed: []
      };
    }

    const choice = response.choices[0];
    const message = choice.message;

    // Add assistant message to context
    currentMessages.push(message);

    // If no tool calls, we're done
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content, toolsUsed };
    }

    // Execute all tool calls
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall) => {
        const { name, arguments: argsStr } = toolCall.function;
        const args = JSON.parse(argsStr);
        const result = await executeToolCall(name, args, userId);
        toolsUsed.push({ name, args, result });
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result),
        };
      })
    );

    // Add tool results to messages
    currentMessages.push(...toolResults);

    // If finish_reason is 'stop' or 'tool_calls', continue loop to get final response
    if (choice.finish_reason === 'stop') break;
  }

  // Get the last message content
  const lastMessage = currentMessages[currentMessages.length - 1];
  if (lastMessage.role === 'assistant') {
    return { reply: lastMessage.content, toolsUsed };
  }

  // Re-call to get final human-readable response after tool results
  try {
    const finalResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: currentMessages,
      max_tokens: 1000,
    });
    return {
      reply: finalResponse.choices[0].message.content,
      toolsUsed,
    };
  } catch (error) {
    return {
      reply: `❌ **Error getting final response from OpenAI**:\n\n${error.message}`,
      toolsUsed,
    };
  }
};

/**
 * Stream a chat response (SSE)
 * @param {Array} messages
 * @param {string} userId
 * @param {object} res - Express response object
 */
const streamChat = async (messages, userId, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key_here')) {
    const reply = "⚠️ **OpenAI API Key Not Configured**\n\nHello! I am your AI Workspace Assistant. It looks like your OpenAI API Key is not set up yet in `backend/.env`.\n\nTo unlock the full power of this platform (including sending emails, creating calendar events, managing Drive files, generating spreadsheets/documents, and sending WhatsApp messages), please set a valid `OPENAI_API_KEY` in your backend environment variables and restart the server.";
    res.write(`data: ${JSON.stringify({ content: reply })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fullContent: reply })}\n\n`);
    res.end();
    return;
  }

  const conversationMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: conversationMessages,
      tools,
      tool_choice: 'auto',
      stream: true,
      max_tokens: 2000,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
    res.end();
  } catch (error) {
    console.error('OpenAI Stream API error:', error);
    let errMsg = `❌ **Error communicating with OpenAI**: ${error.message}`;
    if (error.status === 401) {
      errMsg = "⚠️ **OpenAI Authentication Failed**\n\nThe OpenAI API key provided in the `backend/.env` file is invalid or expired. Please check your credentials at https://platform.openai.com/api-keys.";
    }
    res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fullContent: errMsg })}\n\n`);
    res.end();
  }
};

module.exports = { chat, streamChat };
