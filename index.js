#!/usr/bin/env node
require("dotenv").config();

const { tavily } = require("@tavily/core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const { parse } = require("json2csv");

// Set Ollama endpoint - default is localhost:11434
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"; // Default to llama3 if not specified

// helper: turn CSV→JSON
async function loadCsv(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return csv().fromFile(abs);
}

// helper: ask Ollama to classify one company
async function classifyCompany(name, lookupData, industries) {
  const prompt = `
We have a single client: 

Name: ${name}

Here is info we found on them (from Tavily/web lookup): 
${JSON.stringify(lookupData, null, 2)}

Please classify this client into **one** of the following industries (and ONLY one), and give me a confidence percentage (0–100%).
Reply in JSON:

{
  "industry": "<one of the list>",
  "confidence": <number>
}

Allowed industries:
${industries.join("\n")}
`.trim();

  try {
    const res = await axios.post(
      OLLAMA_API_URL,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        // Optional: Adjust these parameters based on your needs
        temperature: 0.1, // Lower temperature for more deterministic outputs
        num_predict: 200  // Limit token generation
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = res.data.response;
    
    // Extract JSON from the response - Ollama might return additional text
    // Look for JSON pattern between curly braces
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn(`Failed to parse JSON from Ollama response for ${name}. Response: ${responseText}`);
      // Fallback with a default response
      return { industry: "Unknown", confidence: 0 };
    }
    
    try {
      // Try to parse the matched JSON
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.warn(`JSON parse error for ${name}: ${parseError.message}`);
      console.warn(`Raw JSON match: ${jsonMatch[0]}`);
      // Fallback with a default response
      return { industry: "Unknown", confidence: 0 };
    }
  } catch (error) {
    console.error(`Ollama API error for ${name}: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    // Fallback with a default response
    return { industry: "Unknown", confidence: 0 };
  }
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

    console.log(`→ Classifying ${name} using Ollama model ${OLLAMA_MODEL}…`);
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