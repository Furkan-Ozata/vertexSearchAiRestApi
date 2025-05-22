require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
const port = 3000;

app.use(express.json());

app.post("/search", async (req, res) => {
  const query = req.body.query;

  // Print the PATH Node.js sees
  console.log("Node.js process.env.PATH:", process.env.PATH);

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // Add a try-catch block for the async operations
  try {
    const gcloudToken = await getGcloudAuthToken();
    if (!gcloudToken) {
      // This case should ideally be handled by getGcloudAuthToken rejecting
      return res.status(500).json({ error: "Failed to get gcloud auth token" });
    }

    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION;
    const collectionId = process.env.COLLECTION_ID;
    const engineId = process.env.ENGINE_ID;
    const servingConfigId = process.env.SERVING_CONFIG_ID;
    const languageCode = process.env.LANGUAGE_CODE;
    const timeZone = process.env.TIME_ZONE;
    const preamble = process.env.PREAMBLE;

    const discoveryEngineUrl = `https://discoveryengine.googleapis.com/v1alpha/projects/${projectId}/locations/${location}/collections/${collectionId}/engines/${engineId}/servingConfigs/${servingConfigId}:search`;

    const curlCommand = `curl -X POST \
          -H "Authorization: Bearer ${gcloudToken}" \
          -H "Content-Type: application/json" \
          "${discoveryEngineUrl}" \
          -d '{
              "query": "${query}",
              "pageSize": 10,
              "languageCode": "${languageCode}",
              "userInfo": {
                  "timeZone": "${timeZone}"
              },
              "contentSearchSpec": {
                  "snippetSpec": {
                      "returnSnippet": true
                  },
                  "summarySpec": {
                      "useSemanticChunks": true,
                      "includeCitations": true,
                      "summaryResultCount": 3,
                      "modelSpec": {
                          "version": "stable"
                      },
                      "modelPromptSpec": {
                          "preamble": "${preamble}"
                      }
                  }
              }
          }'`;

    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing curl: ${error.message}`);
        // Avoid sending HTML error page, send JSON
        return res.status(500).json({
          error: "Failed to execute search command",
          details: error.message,
        });
      }
      if (stderr) {
        console.error(`Curl stderr: ${stderr}`);
        // Potentially return an error if stderr indicates a problem
        // For now, we'll rely on stdout for the primary response
      }
      try {
        const jsonResponse = JSON.parse(stdout);
        res.json(jsonResponse);
      } catch (parseError) {
        console.error(`Error parsing JSON response: ${parseError.message}`);
        // Send JSON error, include stdout for debugging if it's not valid JSON
        res.status(500).json({
          error: "Failed to parse search response",
          rawOutput: stdout,
        });
      }
    });
  } catch (err) {
    // Catch errors from getGcloudAuthToken or other synchronous issues before exec
    console.error("Server error before executing curl:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

async function getGcloudAuthToken() {
  return new Promise((resolve, reject) => {
    // IMPORTANT: Replace '/path/to/your/gcloud' with the actual path from "which gcloud"
    // For example: const gcloudCommand = "/Users/furkanozata/google-cloud-sdk/bin/gcloud auth print-access-token";
    const gcloudCommand = "gcloud auth print-access-token"; // Keep this as a fallback or if you want to test without full path first
    // If the above line still fails, replace it with the full path like:
    // const gcloudCommand = "/full/path/to/gcloud auth print-access-token";

    exec(gcloudCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(
          `Error getting gcloud token (command: ${gcloudCommand}): ${error.message}`
        );
        // Reject the promise on error
        reject(
          new Error(`Failed to get gcloud token: ${error.message || stderr}`)
        );
        return;
      }
      // It's possible for gcloud to print warnings to stderr but still output token to stdout
      if (stderr && !stdout.trim()) {
        // Only reject if stdout is empty and stderr has content
        console.warn(`Gcloud token stderr (and no token): ${stderr}`);
        reject(new Error(`Gcloud command stderr: ${stderr}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
