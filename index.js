require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/search", async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const gcloudToken = await getGcloudAuthToken();

    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION;
    const collectionId = process.env.COLLECTION_ID;
    const engineId = process.env.ENGINE_ID;
    const servingConfigId = process.env.SERVING_CONFIG_ID;
    const languageCode = process.env.LANGUAGE_CODE;
    const timeZone = process.env.TIME_ZONE;
    const preamble = process.env.PREAMBLE;

    const discoveryEngineUrl = `https://discoveryengine.googleapis.com/v1alpha/projects/${projectId}/locations/${location}/collections/${collectionId}/engines/${engineId}/servingConfigs/${servingConfigId}:search`;

    console.log("Calling Discovery Engine API:", discoveryEngineUrl);

    const response = await axios({
      method: "post",
      url: discoveryEngineUrl,
      headers: {
        Authorization: `Bearer ${gcloudToken}`,
        "Content-Type": "application/json",
      },
      data: {
        query: query,
        pageSize: 10,
        languageCode: languageCode,
        userInfo: {
          timeZone: timeZone,
        },
        contentSearchSpec: {
          snippetSpec: {
            returnSnippet: true,
          },
          summarySpec: {
            useSemanticChunks: true,
            includeCitations: true,
            summaryResultCount: 3,
            modelSpec: {
              version: "stable",
            },
            modelPromptSpec: {
              preamble: preamble,
            },
          },
        },
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Server error during API request:", err);

    const errorMessage = err.response
      ? `API Error: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      : err.message;

    res.status(err.response?.status || 500).json({
      error: "Error processing search request",
      details: errorMessage,
    });
  }
});

// İki yöntemli kimlik doğrulama: Önce gcloud komutu dene, olmazsa servis hesabını dene
async function getGcloudAuthToken() {
  // Önce gcloud komutunu deneyelim
  return new Promise((resolve, reject) => {
    console.log("Trying to get token with gcloud command...");

    const gcloudCommand = "gcloud auth print-access-token";
    exec(gcloudCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting gcloud token: ${error.message}`);
        // Hata durumunda, servis hesabı ile devam et
        tryServiceAccountAuth(resolve, reject);
        return;
      }
      if (stderr && !stdout.trim()) {
        console.warn(`Gcloud token stderr (and no token): ${stderr}`);
        // Hata durumunda, servis hesabı ile devam et
        tryServiceAccountAuth(resolve, reject);
        return;
      }
      console.log("Successfully obtained token via gcloud command");
      resolve(stdout.trim());
    });
  });
}

// Servis hesabı ile kimlik doğrulama deneme
async function tryServiceAccountAuth(resolve, reject) {
  try {
    console.log("Falling back to service account auth...");
    const { GoogleAuth } = require("google-auth-library");

    // .env dosyasındaki JSON string'ini parse et
    let credentials;
    try {
      // JSON string'i düzgün hale getir ve sonra parse et
      let jsonString = process.env.SERVICE_ACCOUNT_JSON;

      // Başta ve sonda tek tırnak varsa kaldır
      if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
      }

      console.log("Trying to parse service account credentials...");
      credentials = JSON.parse(jsonString);

      // Google Auth Library kullanarak servis hesabı ile kimlik doğrulaması
      const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        credentials: credentials,
      });

      const client = await auth.getClient();
      const token = await client.getAccessToken();

      if (!token || !token.token) {
        throw new Error("Could not get access token from service account");
      }

      console.log("Successfully obtained access token from service account");
      resolve(token.token);
    } catch (parseError) {
      console.error("Error with service account auth:", parseError.message);
      reject(
        new Error(
          `All authentication methods failed. Last error: ${parseError.message}`
        )
      );
    }
  } catch (error) {
    console.error(`Error in service account fallback: ${error.message}`);
    reject(
      new Error(
        `All authentication methods failed. Last error: ${error.message}`
      )
    );
  }
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(
    `API available at ${
      process.env.API_URL || "http://localhost:" + port + "/search"
    }`
  );
});
