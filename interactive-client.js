require("dotenv").config();
const axios = require("axios");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const API_URL = process.env.API_URL || "http://localhost:3000/search";

async function search(query) {
  if (!query || query.trim() === "") {
    console.log("Lütfen bir soru sorun.");
    return null;
  }
  try {
    const response = await axios.post(API_URL, { query });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `API Hatası: ${error.response.status}`,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "API'ye ulaşılamadı. Sunucunun çalıştığından emin olun:",
        error.message
      );
    } else {
      console.error("Bir hata oluştu:", error.message);
    }
    return null;
  }
}

function displayResults(data) {
  if (!data) {
    return;
  }

  if (data.summary && data.summary.summaryText) {
    console.log("\n🤖 Cevap:");
    console.log(data.summary.summaryText);
    if (
      data.summary.summaryWithMetadata &&
      data.summary.summaryWithMetadata.citations
    ) {
      console.log("\n📚 Kaynaklar:");
      data.summary.summaryWithMetadata.citations.forEach((citation) => {
        citation.references.forEach((ref) => {
          console.log(
            `- ${ref.uri || ref.title || "Bilinmeyen kaynak"} (Alıntı ID: ${
              citation.id
            })`
          );
        });
      });
    }
  } else if (data.results && data.results.length > 0) {
    console.log("\n🔍 Bulunan Sonuçlar (Özet Yok):");
    data.results.forEach((result, index) => {
      console.log(
        `\n${index + 1}. ${
          result.document.derivedStructData.title || "Başlık Yok"
        }`
      );
      if (
        result.document.derivedStructData.snippets &&
        result.document.derivedStructData.snippets.length > 0
      ) {
        console.log(
          `   Snippet: ${result.document.derivedStructData.snippets[0].snippet}`
        );
      }
      console.log(
        `   Link: ${
          result.document.derivedStructData.link ||
          result.document.uri ||
          "Link Yok"
        }`
      );
    });
  } else if (data.error) {
    console.log(`\n⚠️ Sunucudan Hata: ${data.error}`);
    if (data.details) console.log(`   Detaylar: ${data.details}`);
  } else {
    console.log("\n🤷 Sonuç bulunamadı veya beklenmedik format.");
  }
}

function askQuestion() {
  readline.question("\n🧑 Sen: ", async (query) => {
    if (
      query.toLowerCase() === "exit" ||
      query.toLowerCase() === "quit" ||
      query.toLowerCase() === "çıkış"
    ) {
      readline.close();
      return;
    }
    console.log("🧠 Düşünüyorum...");
    const results = await search(query);
    displayResults(results);
    askQuestion(); // Ask another question
  });
}

console.log("Vertex AI Arama Motoru CLI İstemcisi");
console.log(
  "Soru sormaya başlayın veya çıkmak için 'exit', 'quit' ya da 'çıkış' yazın."
);
askQuestion();
