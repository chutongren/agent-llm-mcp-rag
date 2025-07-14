import OpenAI from "openai";
import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { logTitle } from "./utils";
import 'dotenv/config';

// Openai chat-streaming toolCall
export interface ToolCall { 
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export default class ChatOpenAI {
  private llm: OpenAI
  private model: string
  private tools: Tool[] = []
  private messages: OpenAI.Chat.ChatCompletionMessageParam[] =[]

  constructor(model: string, systemPrompt: string = '', tools: Tool[] = [], context: string = ''){
    this.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
    });
    this.model = model
    this.tools = tools
    if(systemPrompt) this.messages.push({role: 'system', content: systemPrompt})
    if(context) this.messages.push({role: 'user', content: context})
  }

  // Start a chat session
  async chat(prompt?: string){
    logTitle("CHAT");
    if(prompt) this.messages.push({role: 'user', content: prompt})

    const stream = await this.llm.chat.completions.create({
      model: this.model,
      messages: this.messages,
      stream: true,
      tools: this.getToolsDefinition(), //adaption mcp.tools->openai.tools  
    })

    let content = ''
    let toolCalls: ToolCall[] = []
    logTitle('RESPONSE')

    // process the streaming response
    for await (const chunk of stream){
      const delta = chunk.choices[0].delta

      // handle content
      if(delta.content){
        content += delta.content
        process.stdout.write(delta.content) // 	comparing to console.log(), writes without newline
      }

      // handle toolCalls
      if(delta.tool_calls){
        for(const toolCallChunk of delta.tool_calls){
          // if the first time receive a tool_call, create 
          while(toolCalls.length <= toolCallChunk.index){ 
            toolCalls.push({id: '', function: {name: '', arguments: ''}})
          }

          let currentCall = toolCalls[toolCallChunk.index] // eg. "id": "call_abc123", "index": 0 (from 0 to call_tools.length)
          
          if(toolCallChunk.id) currentCall.id += toolCallChunk.id
          if(toolCallChunk.function?.name) currentCall.function.name += toolCallChunk.function.name
          if(toolCallChunk.function?.arguments) currentCall.function.arguments += toolCallChunk.function.arguments
        }
      }
    }
    // add model's replied content and tool calls to messages history
    // this.messages.push({role: 'assistant', content, tool_calls: toolCalls.map(call=>({type: 'function', id: call.id, function: call.function}))})
    this.messages.push({
      role: 'assistant',
      content,
      ...(toolCalls.length > 0 && {
        tool_calls: toolCalls.map(call => ({
          type: 'function',
          id: call.id,
          function: call.function
        }))
      })
    });
    
    return {content, toolCalls}
  }

  // Append tool execution result to the conversation history
  public appendToolResult(toolCallId: string, toolOutput: string){
    this.messages.push({role: 'tool', content: toolOutput, tool_call_id: toolCallId})
  }

  // Convert MCP tools to OpenAI tools format 
  private getToolsDefinition(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return this.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
}
}
