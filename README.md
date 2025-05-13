Client Industry Classifier

A Node.js script that automatically classifies companies into predefined industry categories using Tavily search API and Ollama LLM inference.
Overview
This script takes a list of client companies, performs web searches to gather information about each company, and then uses a local LLM (via Ollama) to classify each company into a single industry category from a predefined list. The results are saved as a CSV file.
Features

Automatically searches the web for company information using Tavily API
Uses a local LLM (via Ollama) to analyze company data and classify into industries
Processes companies in bulk from a CSV input file
Configurable LLM model selection
Outputs results to a CSV file with company ID, name, and classified industry

Prerequisites

Node.js (v14 or higher recommended)
Ollama running locally or on a remote server
Tavily API key

Installation

Clone this repository or download the script
Install dependencies:

bashnpm install dotenv @tavily/core axios fs path csvtojson json2csv

Create a .env file in the project root with the following variables:

TAVILY_API_KEY=your_tavily_api_key_here
OLLAMA_API_URL=http://localhost:11434/api/generate  # Change if using a remote Ollama instance
OLLAMA_MODEL=llama3.2  # Change to your preferred model
Directory Structure
Create the following directory and files:
/data
  /clients.csv    # Your input clients file
  /industries.csv # Your list of industry categories
File Formats
clients.csv
Must contain at least these columns:

id: A unique identifier for each client
name: The company name to search for and classify

Example:
id,name
1,"Acme Corporation"
2,"Tech Innovations Inc"
3,"Global Logistics Partners"
industries.csv
Must contain a name column with the list of valid industry categories:
Example:
name
"Technology"
"Healthcare"
"Finance"
"Manufacturing"
"Retail"
"Transportation"
Usage
Run the script with:
bashnode client-classifier.js
The script will:

Load clients and industries from the CSV files
For each client, search for company information using Tavily
Pass the company name and search results to Ollama for classification
Output results to classified_clients.csv in the project root

Output
The script generates a file named classified_clients.csv with the following columns:

id: The original client ID
name: The company name
industry: The classified industry from the predefined list

Customization

Change the Ollama model by setting the OLLAMA_MODEL environment variable
Adjust the Ollama inference parameters in the classifyCompany function
Modify the prompt template for classification in the same function

Troubleshooting

"File not found": Ensure your CSV files exist in the correct location
Ollama API errors: Check that Ollama is running and accessible at the specified URL
JSON parsing errors: The LLM may not always return properly formatted JSON; the script tries to handle this gracefully