import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// command + arguments
export default class MCPClient{
    private mcp: Client;
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];
    private command: string;
    private args: string[];
  
    constructor(name: string, command: string, args: string[], version?: string) {
      this.mcp = new Client({ name, version: version || "0.0.1" }); //"mcp-client-cli"
      this.command = command;
      this.args = args;
    }

    public async init(){
        await this.connectToServer()
    }

    public async close(){
        await this.mcp.close()
    }

    public getTools(){
        return this.tools
    }

    public async callTool(name: string, params: Record<string, any>) {
        return await this.mcp.callTool({
            name,
            arguments: params
        });
    }

    private async connectToServer() {
        try {
          this.transport = new StdioClientTransport({
            command: this.command,
            args: this.args,
          });
          await this.mcp.connect(this.transport);
      
          const toolsResult = await this.mcp.listTools();
          this.tools = toolsResult.tools.map((tool) => {
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            };
          });
          console.log(
            "Connected to server with tools:",
            this.tools.map(({ name }) => name)
          );
        } catch (e) {
          console.log("Failed to connect to MCP server: ", e);
          throw e;
        }
      }
}