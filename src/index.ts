import Agent from "./Agent";
import MCPClient from "./MCPClient";
import EmbeddingRetriever from "./EmbeddingRetriever";
import { logTitle } from "./utils";
import path from "path";
import fs from "fs";

const currentDir = process.cwd()
const knowledgeDir = path.join(process.cwd(), "knowledge")
const outPath = path.join(process.cwd(), "output")
const URL = "https://www.xiaolincoding.com/interview/java.html";
const question = "what's the difference of interface and abstract class in Java?"

const TASK = `
Based on the context from the "knowledge" folder and the content from ${URL},  
summarize and answer the following question in English: ${question}.  
Output your answer as a nicely formatted Markdown file at ${outPath}/interview-java1.md.
`;

const fetchMCP = new MCPClient('fetch', 'uvx', ['mcp-server-fetch']) // fetch from website
const fileMCP = new MCPClient('file', 'npx', [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    currentDir,
  ]) // file reading/writing

async function main() {
  // RAG
  const context = await retrieveContext()

  // Agent
  const agent = new Agent(
    "openai/gpt-4o-mini",
    [fetchMCP, fileMCP],
    "",
    context
  );
  await agent.init()
  await agent.invoke(TASK)
  await agent.close()
}
main()

async function retrieveContext() {
    const embeddingModel = "BAAI/bge-m3"
    const embeddingRetriever = new EmbeddingRetriever(embeddingModel)
    const files = fs.readdirSync(knowledgeDir)
    for await (const file of files) {
      const content = fs.readFileSync(path.join(knowledgeDir, file), "utf-8")
      await embeddingRetriever.embedDocument(content)
    }
    const context = (await embeddingRetriever.retrieve(TASK, 3)).join("\n")
    logTitle("CONTEXT")
    console.log(context)
    return context
  }