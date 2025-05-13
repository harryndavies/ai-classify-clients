#!/usr/bin/env node
require("dotenv").config();

const { tavily } = require("@tavily/core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const { parse } = require("json2csv");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// 1) load your list of industries
const INDUSTRIES = [
  "Automotive",
  "Energy, oil & gas",
  "Gambling",
  "Legal",
  "Religion",
  "Retail - luxury",
  "Telecommunications",
  "Banking",
  "Engineering",
  "Gaming",
  "Retail - apparel",
  "Manufacturing",
  "Travel",
  "Retail - music/film",
  "Charity",
  "Events",
  "Government",
  "Media",
  "Retail - beauty",
  "Retail - other",
  "Consumer",
  "Finance",
  "Healthcare",
  "Raw materials",
  "Retail - DIY",
  "Retail - sports",
  "Education",
  "Fast-moving consumer goods (FMCG)",
  "Food",
  "Insurance",
  "Real estate",
  "Retail - home & garden",
  "Technology",
  "Fashion",
];

// 2) helper: turn CSV→JSON
async function loadCsv(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return csv().fromFile(abs);
}

// 3) helper: ask ChatGPT to classify one company
async function classifyCompany(name, lookupData) {
  const prompt = `
We have a single client:

  Name: ${name}

Here is info we found on them (from Tavily/web lookup):

  ${JSON.stringify(lookupData, null, 2)}

Please classify this client into **one** of the following industries (and ONLY one), and give me a confidence percentage (0–100%).  Reply in JSON:

{
  "industry": "<one of the list>",
  "confidence": <number>
}

Allowed industries:
${INDUSTRIES.join("\n")}
  `.trim();

  const res = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful classification assistant.",
        },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return JSON.parse(res.data.choices[0].message.content);
}

async function main() {
  const [question, csvPath] = process.argv.slice(2);
  if (!csvPath) {
    console.error("Usage: node classify.js path/to/clients.csv");
    process.exit(1);
  }
  const clients = await loadCsv(csvPath);

  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const output = [];

  for (const { name } of clients) {
    console.log(`→ Looking up ${name}…`);
    const lookupData = await tvly.search(name);

    console.log(`→ Classifying ${name}…`);
    const { industry, confidence } = await classifyCompany(name, lookupData);

    output.push({ name, industry, confidence });
    console.log(`✔ ${name} → ${industry} (${confidence}%)`);
  }

  // write out new CSV
  const csvOut = parse(output, { fields: ["name", "industry", "confidence"] });
  fs.writeFileSync("classified_clients.csv", csvOut, "utf8");
  console.log("✅ Written classified_clients.csv");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
