#!/usr/bin/env node
require("dotenv").config();

const { tavily } = require("@tavily/core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const { parse } = require("json2csv");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// helper: turn CSV→JSON
async function loadCsv(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return csv().fromFile(abs);
}

// helper: ask ChatGPT to classify one company
async function classifyCompany(name, lookupData, industries) {
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
${industries.join("\n")}
  `.trim();

  const res = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful classification assistant." },
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
  // 1) load clients and industries CSVs
  //    clients.csv must have `id` and `name` columns
  const clients = await loadCsv("data/clients.csv");
  //    industries.csv must have a `name` column
  const industriesCsv = await loadCsv("data/industries.csv");
  const INDUSTRIES = industriesCsv.map(row => row.name);

  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const output = [];

  for (const row of clients) {
    const { id, name } = row;
    if (!id || !name) {
      console.warn(`Skipping row with missing id or name: ${JSON.stringify(row)}`);
      continue;
    }

    console.log(`→ Looking up ${name} (ID: ${id})…`);
    const lookupData = await tvly.search(name);

    console.log(`→ Classifying ${name}…`);
    const { industry, confidence } = await classifyCompany(name, lookupData, INDUSTRIES);

    output.push({ id, name, industry, confidence });
    console.log(`✔ [${id}] ${name} → ${industry} (${confidence}%)`);
  }

  // 2) write out new CSV, preserving id and name
  const csvOut = parse(output, {
    fields: ["id", "name", "industry"]
  });
  fs.writeFileSync("classified_clients.csv", csvOut, "utf8");
  console.log("✅ Written classified_clients.csv (with id, name, industry)");
}

main().catch(err => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
