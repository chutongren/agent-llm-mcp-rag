import Agent from "./Agent";
import MCPClient from "./MCPClient";
import path from "path";

import fs from "fs";
import { logTitle } from "./utils";
import EmbeddingRetriever from "./EmbeddingRetriever";

const currentDir = process.cwd()
const knowledgeDir = path.join(process.cwd(), "knowledge")
const URL = "https://www.xiaolincoding.com/interview/java.html";
const outPath = path.join(process.cwd(), "output")
const question = "what's the difference of interface and abstract class in Java?"

const TASK = `
context是从本地知识库knowledge文件夹中获取的内容，URL是网页链接，
请你参考context中找到的相关信息和${URL}中的信息,总结后
给我对于${question}的回答(用英文回答)，并保存到${outPath}/interview-java1.md,输出一个漂亮md文件
`;

const fetchMCP = new MCPClient('fetch', 'uvx', ['mcp-server-fetch'])
const fileMCP = new MCPClient('file', 'npx', [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    currentDir,
  ])

async function main() {
  // RAG
  const context = await retrieveContext();

  // Agent
  const agent = new Agent(
    "openai/gpt-4o-mini",
    [fetchMCP, fileMCP],
    "",
    context
  );
  await agent.init();
  await agent.invoke(TASK);
  await agent.close();
}
main()

async function retrieveContext() {
    // RAG
    const embeddingRetriever = new EmbeddingRetriever("BAAI/bge-m3");
    // const knowledgeDir = path.join(process.cwd(), "knowledge");
    const files = fs.readdirSync(knowledgeDir);
    for await (const file of files) {
      const content = fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
      await embeddingRetriever.embedDocument(content);
    }
    const context = (await embeddingRetriever.retrieve(TASK, 3)).join("\n");
    logTitle("CONTEXT");
    console.log(context);
    return context;
  }