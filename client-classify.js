require("dotenv").config();

const { tavily } = require("@tavily/core");
const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const { parse } = require("json2csv");
const { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Set OpenAI model - default to a GPT model
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

// helper: turn CSV→JSON
async function loadCsv(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return csv().fromFile(abs);
}

// helper: ask OpenAI to classify one company
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
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that classifies companies into industries. You ONLY respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, // Lower temperature for more deterministic outputs
      response_format: { type: "json_object" } // Enforce JSON response format
    });

    const responseText = response.choices[0].message.content;
    try {
      // Parse the JSON response
      return JSON.parse(responseText);
    } catch (parseError) {
      console.warn(`JSON parse error for ${name}: ${parseError.message}`);
      console.warn(`Raw response: ${responseText}`);
      // Fallback with a default response
      return { industry: "Unknown", confidence: 0 };
    }
  } catch (error) {
    console.error(`OpenAI API error for ${name}: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    // Fallback with a default response
    return { industry: "Unknown", confidence: 0 };
  }
}

async function main() {
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }
  if (!process.env.TAVILY_API_KEY) {
    console.error("Error: TAVILY_API_KEY environment variable is required");
    process.exit(1);
  }

  // 1) load clients and industries CSVs
  //    clients.csv must have `id` and `name` columns
  const clients = await loadCsv("data/clients.csv");
  //    industries.csv must have `id` and `name` columns
  const industriesCsv = await loadCsv("data/industries.csv");

  // Build helper structures
  const INDUSTRIES = industriesCsv.map(row => row.name); // list of names for the classifier
  const industryMap = new Map(industriesCsv.map(row => [row.name, row.id])); // name → id lookup

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

    console.log(`→ Classifying ${name} using OpenAI model ${OPENAI_MODEL}…`);
    const { industry, confidence } = await classifyCompany(name, lookupData, INDUSTRIES);

    // look up the industry's id; fallback to empty string if not found
    const industryId = industryMap.get(industry) || "";

    output.push({ id, name, industry_id: industryId, industry, confidence });
    console.log(`✔ [${id}] ${name} → ${industry} (ID: ${industryId}) (${confidence}%)`);
  }

  // 2) write out new CSV, preserving id and name, and including industry_id
  const csvOut = parse(output, {
    fields: ["id", "name", "industry_id", "industry", "confidence"]
  });
  fs.writeFileSync("./data/classified_clients.csv", csvOut, "utf8");
  console.log("✅ Written classified_clients.csv (with id, name, industry_id, industry, confidence)");
}

main().catch(err => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
