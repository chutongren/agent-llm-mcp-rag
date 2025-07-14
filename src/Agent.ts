import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import { logTitle } from "./utils";


export default class Agent{
    private mcpClients: MCPClient[]
    private llm!: ChatOpenAI
    private model: string
    private systemPrompt: string
    private context: string

    constructor(model: string, mcpClients: MCPClient[], systemPrompt: string='', context: string=''){
        this.mcpClients = mcpClients
        this.model = model
        this.systemPrompt = systemPrompt
        this.context = context
    }

    public async init(){
        // new一个ChatOpenAI，初始化所有的 mcpServer
        logTitle('INIT LLM AND TOOLS')

        for(const mcpClient of this.mcpClients){
            await mcpClient.init()
        }
        // flatMap展平，把他们压到一个数组里面
        const tools = this.mcpClients.flatMap(mcpClient=>mcpClient.getTools())
        this.llm = new ChatOpenAI(this.model, this.systemPrompt, tools, this.context)
    }

    public async close(){
        logTitle('CLOSE MCP CLIENT')
        for await (const client of this.mcpClients){
            await client.close()
        }
    }

    async invoke(prompt: string){
        if(!this.llm) throw new Error('LLM not initialized')
        let response = await this.llm.chat(prompt)

        // 这就是“多轮工具调用”——模型可以根据工具返回的结果，继续发起新的工具调用，直到它觉得不需要再用工具为止。
        while(true){
            // 
            if(response.toolCalls.length>0){
                for(const toolCall of response.toolCalls){
                    const mcp = this.mcpClients.find(mcpClient=>mcpClient.getTools().find(t=>t.name===toolCall.function.name))
                    if(mcp){
                        logTitle(`TOOL USE`);
                        console.log(`Calling tool: ${toolCall.function.name}`);
                        console.log(`Arguments: ${toolCall.function.arguments}`);
                        
                        const result = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments))
                        
                        console.log(`Result: ${result}`)
                        this.llm.appendToolResult(toolCall.id, JSON.stringify(result))
                    }else{
                        this.llm.appendToolResult(toolCall.id, 'Tool not found')
                    }
                }

                // after tool calling, continue chatting
                response = await this.llm.chat()
                continue
            }

            // wihout tool calling, then end the chat
            await this.close()
            return response.content
        }

    }

}   
