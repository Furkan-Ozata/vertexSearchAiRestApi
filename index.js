require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Session yönetimi için basit in-memory storage
const sessionStore = new Map();

// Session oluşturma endpoint'i
app.post("/session", async (req, res) => {
  const { userPseudoId, displayName } = req.body;

  try {
    const gcloudToken = await getGcloudAuthToken();
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION;
    const collectionId = process.env.COLLECTION_ID;
    const engineId = process.env.ENGINE_ID;

    // Session oluşturma URL'si
    const sessionUrl = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${location}/collections/${collectionId}/engines/${engineId}/sessions`;

    console.log("Creating new session:", sessionUrl);

    const sessionData = {
      userPseudoId: userPseudoId || `user_${Date.now()}`,
      displayName:
        displayName || `Session ${new Date().toLocaleString("tr-TR")}`,
    };

    const response = await axios({
      method: "post",
      url: sessionUrl,
      headers: {
        Authorization: `Bearer ${gcloudToken}`,
        "Content-Type": "application/json",
      },
      data: sessionData,
    });

    // Session'ı local storage'da da saklayalım
    const sessionId = response.data.name;
    sessionStore.set(sessionId, {
      ...response.data,
      turnCount: 0,
      created: new Date().toISOString(),
    });

    console.log("Session created successfully:", sessionId);
    res.json(response.data);
  } catch (err) {
    console.error("Error creating session:", err);
    const errorMessage = err.response
      ? `API Error: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      : err.message;

    res.status(err.response?.status || 500).json({
      error: "Error creating session",
      details: errorMessage,
    });
  }
});

// Session listesi
app.get("/sessions", (req, res) => {
  const sessions = Array.from(sessionStore.values()).map((session) => ({
    name: session.name,
    displayName: session.displayName,
    userPseudoId: session.userPseudoId,
    turnCount: session.turnCount,
    created: session.created,
    state: session.state,
  }));

  res.json({ sessions });
});

// Tek session bilgisi
app.get("/session/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const gcloudToken = await getGcloudAuthToken();

    // Google API'den session bilgisini çek
    const sessionUrl = `https://discoveryengine.googleapis.com/v1/${sessionId}`;

    const response = await axios({
      method: "get",
      url: sessionUrl,
      headers: {
        Authorization: `Bearer ${gcloudToken}`,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error getting session:", err);
    const errorMessage = err.response
      ? `API Error: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      : err.message;

    res.status(err.response?.status || 500).json({
      error: "Error getting session",
      details: errorMessage,
    });
  }
});

app.post("/search", async (req, res) => {
  const { query, sessionId, searchResultPersistenceCount = 5 } = req.body;

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

    // Search request data'sını hazırla
    const searchData = {
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
    };

    // Eğer sessionId varsa, sessionSpec'i ekleyelim
    if (sessionId) {
      // Yeni query ID oluştur
      const queryId = `query_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      searchData.session = sessionId;
      searchData.sessionSpec = {
        queryId: queryId,
        searchResultPersistenceCount: searchResultPersistenceCount,
      };

      // Local storage'da session bilgisini güncelle
      if (sessionStore.has(sessionId)) {
        const sessionInfo = sessionStore.get(sessionId);
        sessionInfo.turnCount += 1;
        sessionInfo.lastQuery = query;
        sessionInfo.lastQueryId = queryId;
        sessionInfo.updated = new Date().toISOString();
        sessionStore.set(sessionId, sessionInfo);
      }

      console.log(
        `Multi-turn search with session: ${sessionId}, queryId: ${queryId}`
      );
    }

    const response = await axios({
      method: "post",
      url: discoveryEngineUrl,
      headers: {
        Authorization: `Bearer ${gcloudToken}`,
        "Content-Type": "application/json",
      },
      data: searchData,
    });

    // Response'a session bilgisini de ekleyelim
    const responseData = {
      ...response.data,
      sessionInfo: sessionId
        ? {
            sessionId: sessionId,
            queryId: searchData.sessionSpec?.queryId,
            turnNumber: sessionStore.get(sessionId)?.turnCount || 0,
            isMultiTurn: true,
          }
        : {
            isMultiTurn: false,
          },
    };

    res.json(responseData);
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
