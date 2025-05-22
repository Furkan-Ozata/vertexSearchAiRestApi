# Vertex AI Search API

This project provides a Node.js Express REST API to query Google Cloud Vertex AI Search.

## Prerequisites

- Node.js and npm installed.
- Google Cloud SDK (`gcloud`) installed and authenticated.

## Setup

1. Clone the repository (if applicable) or ensure you have the project files.
2. Navigate to the project directory:
   ```bash
   cd /Users/furkanozata/Desktop/ssssss
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the API

To start the API server, run:

```bash
npm start
```

This will typically start the server on `http://localhost:3000` (or as configured).

## API Endpoint

### POST /search

Executes a search query against the Vertex AI Search engine.

**Request Body:**

```json
{
  "query": "your search query here"
}
```

**Example cURL request to the local API:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "dava adami nasil olunur"
  }' \
  http://localhost:3000/search
```

**Success Response (200 OK):**

The response from the Vertex AI Search API.

**Error Responses:**

- `400 Bad Request`: If the `query` is missing from the request body.
- `500 Internal Server Error`: If there's an issue executing the gcloud command or the cURL command to Vertex AI, or parsing the response.

## How it Works

1. The API endpoint `/search` receives a POST request with a JSON body containing the `query`.
2. It first retrieves a gcloud access token using `gcloud auth print-access-token`.
3. It then constructs and executes the cURL command you provided, inserting the user's query and the fetched gcloud token.
4. The response from the cURL command (which is the JSON response from Vertex AI Search) is then returned to the client.

## To-Do / Improvements

- More robust error handling.
- Configuration for Vertex AI project details, engine ID, etc. (e.g., via environment variables).
- Potentially using the Google Cloud Node.js client libraries instead of shelling out to `curl` and `gcloud` for better integration and security.
