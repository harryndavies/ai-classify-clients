# 📊 Client Industry Classifier

A **Node.js** script that automatically classifies companies into predefined industry categories using the **Tavily Search API** and **OpenAI** for LLM inference.

---

## 🧠 Overview

This script processes a list of client companies by:
- Performing web searches to gather information (via **Tavily API**)
- Using **OpenAI** to classify each company into a single industry category from a predefined list
- Saving the results into a CSV file

---

## ✨ Features

- 🔍 Searches the web for company info using Tavily
- 🤖 Classifies companies with a local LLM via OpenAI
- 📂 Processes client data in bulk from a CSV file
- ⚙️ Configurable LLM model selection
- 📄 Outputs classification results to a CSV file

---

## 🔧 Prerequisites

- Node.js (v14 or higher)
- **OpenAI** API key
- A valid **Tavily API key**

---

## 📦 Installation

1. Clone this repository or download the script  
2. Install dependencies:

   ```bash
   npm install dotenv @tavily/core axios fs path csvtojson json2csv
   ```

3. Create a `.env` file in the project root with:

   ```env
   TAVILY_API_KEY=your_tavily_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

---

## 📁 Directory Structure

```bash
/data
  ├── clients.csv      # Input file: list of client companies
  └── industries.csv   # Input file: list of valid industry categories
  └── classified_clients.csv   # Output file: list of client companies with industry classification
```

---

## 🗂️ File Formats

### `clients.csv`

Must include:

| id | name                  |
|----|-----------------------|
| 1  | "Acme Corporation"    |
| 2  | "Tech Innovations Inc"|
| 3  | "Global Logistics Partners"|

### `industries.csv`

Must include:

| name           |
|----------------|
| "Technology"   |
| "Healthcare"   |
| "Finance"      |
| "Manufacturing"|
| "Retail"       |
| "Transportation"|

---

## 🚀 Usage

Run the script:

```bash
node client-classifier.js
```

The script will:
1. Load clients and industries from CSV files
2. Search for company info using Tavily
3. Classify the company with OpenAI
4. Output results to `classified_clients.csv`

---

\## 📤 Output

The result file `classified_clients.csv` will contain:

| id | name                      | industry       |
|----|---------------------------|----------------|
| 1  | Acme Corporation          | Manufacturing  |
| 2  | Tech Innovations Inc      | Technology     |
| 3  | Global Logistics Partners | Transportation |

---

## ⚙️ Customization

-  Modify LLM parameters or prompts inside the `classifyCompany` function for fine-tuning behavior

---

## 🛠 Troubleshooting

| Issue              | Solution                                          |
|--------------------|---------------------------------------------------|
| File not found     | Ensure `clients.csv` and `industries.csv` exist  |
| JSON parsing error | Script includes basic handling for bad responses |

---
