# Client Industry Classifier

A Node.js script that automatically classifies companies into predefined industry categories using web search data and AI-powered text classification.

## Overview

This script:

1. Loads a list of clients from a CSV file
2. Searches the web for information about each client using Tavily's search API
3. Uses OpenAI's GPT-4 to classify each client into a predefined industry category
4. Outputs a new CSV file with industry classifications

## Prerequisites

- Node.js (v14 or later recommended)
- NPM or Yarn
- API keys for:
  - OpenAI
  - Tavily

## Installation

1. Clone this repository or download the script
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the project root with your API keys:

```
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

## Input Data Format

The script requires two CSV files in the `data/` directory:

### `data/clients.csv`

A CSV file containing client information with at least these columns:
- `id`: A unique identifier for each client
- `name`: The company name to search for and classify

Example:
```csv
id,name
1,Acme Corporation
2,Globex Industries
3,Umbrella Corp
```

### `data/industries.csv`

A CSV file containing the list of allowed industry categories with at least a `name` column:

Example:
```csv
name
Technology
Healthcare
Finance
Manufacturing
Retail
```

## Usage

Run the script:

```bash
node classify-clients.js
```

The script will:
1. Process each client in the input file
2. Display progress in the console
3. Generate a `classified_clients.csv` file with the results

## Output

The script produces a file named `classified_clients.csv` with the following columns:
- `id`: The original client ID
- `name`: The original client name
- `industry`: The classified industry category

Note: Confidence scores are used during classification but not included in the final output file.

## Example Console Output

```
→ Looking up Acme Corporation (ID: 1)…
→ Classifying Acme Corporation…
✔ [1] Acme Corporation → Manufacturing (92%)
→ Looking up Globex Industries (ID: 2)…
→ Classifying Globex Industries…
✔ [2] Globex Industries → Technology (87%)
→ Looking up Umbrella Corp (ID: 3)…
→ Classifying Umbrella Corp…
✔ [3] Umbrella Corp → Healthcare (95%)
✅ Written classified_clients.csv (with id, name, industry)
```

## Limitations

- Classification accuracy depends on available web information for each company
- The script processes companies sequentially, which may be slow for large datasets
- Only a single industry category is assigned to each company

## Dependencies

- `@tavily/core`: Web search API
- `axios`: HTTP client for OpenAI API requests 
- `dotenv`: Environment variable management
- `csvtojson`: CSV parsing
- `json2csv`: JSON to CSV conversion

## License

MIT
