# Vertex AI Search API

This project provides a Node.js Express REST API to query Google Cloud Vertex AI Search.

## Prerequisites

- Node.js and npm installed (LTS version recommended).
- Google Cloud SDK (`gcloud`) installed and authenticated. Ensure you have the necessary permissions to access Vertex AI Search.

## Setup

1.  **Clone the repository (if applicable) or download the project files.**

    ```bash
    # If cloning:
    # git clone <repository-url>
    # cd <repository-name>
    ```

2.  **Navigate to the project directory:**
    If you haven't already, change to the project's root directory.

    ```bash
    cd /path/to/your/project/vertexSearchAiRestApi
    ```

    _(Replace `/path/to/your/project/vertexSearchAiRestApi` with the actual path to the project directory on your system.)_

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project. This file will store your Google Cloud project configuration and other sensitive details.
    Copy the following content into your `.env` file and replace the placeholder values with your actual configuration:

    ```env
    # Google Cloud Project Details
    PROJECT_ID="your-gcp-project-id"
    LOCATION="global" # Or your specific location e.g., "us-central1"
    COLLECTION_ID="default_collection" # Or your specific collection
    ENGINE_ID="your-engine-id"
    SERVING_CONFIG_ID="default_config" # Or your specific serving config

    # Search Configuration
    LANGUAGE_CODE="en" # Or your desired language code e.g., "tr"
    TIME_ZONE="UTC" # Or your desired time zone e.g., "America/New_York", "Europe/Istanbul"
    PREAMBLE="Provide a concise answer to the user\'s query based on the search results." # Customize as needed

    # API Server Port (Optional, defaults to 3000 if not set)
    # PORT=3000
    ```

    **Important:** Ensure that `.env` is listed in your `.gitignore` file to prevent committing sensitive credentials to your repository. If it's not, add `.env` to a new line in `.gitignore`.

## Running the API

To start the API server, run:

```bash
npm start
```

This will typically start the server on `http://localhost:3000` (or the port specified in your `.env` file or `PORT` environment variable). You should see a confirmation message in the console if the server starts successfully.

## API Endpoint

### POST /search

Executes a search query against the configured Vertex AI Search engine.

**Request Body (JSON):**

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
    "query": "What are the latest advancements in AI?"
  }' \
  http://localhost:3000/search
```

**Success Response (200 OK):**

The JSON response directly from the Vertex AI Search API. The structure will depend on your Vertex AI Search configuration and the results.

**Error Responses:**

- `400 Bad Request`: If the `query` field is missing or empty in the request body.
  ```json
  { "error": "Query is required" }
  ```
- `500 Internal Server Error`: If there's an issue:
  - Obtaining the gcloud authentication token.
  - Executing the cURL command to Vertex AI.
  - Parsing the response from Vertex AI.
  - Other unexpected server-side errors.
    The error message will provide more details.
  ```json
  { "error": "Failed to get gcloud auth token" }
  // or
  { "error": "Error executing search", "details": "..." }
  // or
  { "error": "Failed to parse search results", "details": "..." }
  ```

## How it Works

1.  The API server listens for POST requests on the `/search` endpoint.
2.  When a request is received, it validates that a `query` is present in the JSON body.
3.  It attempts to retrieve a Google Cloud access token using the `gcloud auth print-access-token` command.
4.  It constructs a `curl` command to make a POST request to the Google Discovery Engine API, embedding the user's query, the access token, and other configuration parameters (like project ID, engine ID, language code, etc.) sourced from environment variables.
5.  The `curl` command is executed.
6.  The JSON response from the Vertex AI Search API (obtained via `curl`'s standard output) is parsed and then sent back as the response to the original client request.
7.  Error handling is in place to catch issues at various stages (token retrieval, `curl` execution, response parsing).

## To-Do / Improvements

- **Enhanced Error Handling:** Implement more granular error handling and provide more specific error messages to the client.
- **Input Validation:** Add more comprehensive validation for the request body.
- **Google Cloud Client Libraries:** Consider replacing the `gcloud` and `curl` command-line executions with the official Google Cloud Node.js client libraries (e.g., `@google-cloud/discoveryengine`). This would offer:
  - Better performance (avoids shell overhead).
  - Improved security (less risk of command injection, better token management).
  - More robust error handling and type safety.
  - Easier integration with other Google Cloud services.
- **Logging:** Implement more structured logging (e.g., using a library like Winston or Pino) for better debugging and monitoring.
- **Testing:** Add unit and integration tests.
- **Security:** Review and implement security best practices (e.g., rate limiting, input sanitization if not using client libraries).
