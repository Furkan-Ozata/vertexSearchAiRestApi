require("dotenv").config();
const axios = require("axios");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const API_BASE_URL = process.env.API_URL
  ? process.env.API_URL.replace("/search", "")
  : "http://localhost:3000";
const SEARCH_URL = `${API_BASE_URL}/search`;
const SESSION_URL = `${API_BASE_URL}/session`;
const SESSIONS_URL = `${API_BASE_URL}/sessions`;

// Global session durumu
let currentSession = null;
let turnNumber = 0;

async function createSession(displayName) {
  try {
    const response = await axios.post(SESSION_URL, {
      displayName:
        displayName || `Sohbet ${new Date().toLocaleString("tr-TR")}`,
      userPseudoId: `user_${Date.now()}`,
    });
    currentSession = response.data;
    turnNumber = 0;
    console.log(
      `✅ Yeni sohbet oturumu oluşturuldu: ${currentSession.displayName}`
    );
    console.log(`📍 Oturum ID: ${currentSession.name}`);
    return currentSession;
  } catch (error) {
    console.error(
      "❌ Oturum oluşturulurken hata:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function listSessions() {
  try {
    const response = await axios.get(SESSIONS_URL);
    const sessions = response.data.sessions || [];

    if (sessions.length === 0) {
      console.log("📭 Henüz hiç oturum yok.");
      return;
    }

    console.log("\n📋 Mevcut Oturumlar:");
    sessions.forEach((session, index) => {
      const isActive = currentSession && session.name === currentSession.name;
      console.log(
        `${isActive ? "👉" : "  "} ${index + 1}. ${session.displayName} (${
          session.turnCount
        } konuşma)`
      );
      console.log(`     ID: ${session.name.split("/").pop()}`);
      console.log(
        `     Oluşturma: ${new Date(session.created).toLocaleString("tr-TR")}`
      );
    });
  } catch (error) {
    console.error(
      "❌ Oturumlar listelenirken hata:",
      error.response?.data || error.message
    );
  }
}

async function search(query, useSession = true) {
  if (!query || query.trim() === "") {
    console.log("Lütfen bir soru sorun.");
    return null;
  }

  try {
    const requestData = { query };

    // Session kullanılacaksa ve mevcut bir session varsa ekle
    if (useSession && currentSession) {
      requestData.sessionId = currentSession.name;
      requestData.searchResultPersistenceCount = 5;
      turnNumber += 1;
    }

    const response = await axios.post(SEARCH_URL, requestData);
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

  // Session bilgisini göster
  if (data.sessionInfo) {
    if (data.sessionInfo.isMultiTurn) {
      console.log(
        `\n🔗 Oturum: ${data.sessionInfo.sessionId.split("/").pop()} | Turn: ${
          data.sessionInfo.turnNumber
        }`
      );
    } else {
      console.log("\n🔍 Tek seferlik arama (oturumsuz)");
    }
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
  // Prompt'u session durumuna göre güncelle
  const prompt = currentSession
    ? `\n🧑 Sen (Oturum: ${currentSession.displayName}): `
    : "\n🧑 Sen (Oturumsuz): ";

  readline.question(prompt, async (input) => {
    const query = input.trim();

    // Komutları kontrol et
    if (
      query.toLowerCase() === "exit" ||
      query.toLowerCase() === "quit" ||
      query.toLowerCase() === "çıkış"
    ) {
      readline.close();
      return;
    }

    // Yeni oturum oluştur komutu
    if (query.startsWith("/yeni") || query.startsWith("/new")) {
      const parts = query.split(" ");
      const sessionName = parts.slice(1).join(" ") || undefined;
      await createSession(sessionName);
      askQuestion();
      return;
    }

    // Oturumları listele
    if (query === "/list" || query === "/oturumlar") {
      await listSessions();
      askQuestion();
      return;
    }

    // Oturumsuz arama
    if (query.startsWith("/single") || query.startsWith("/tek")) {
      const actualQuery = query.replace(/^\/(?:single|tek)\s*/, "");
      if (actualQuery) {
        console.log("🧠 Oturumsuz arama yapıyorum...");
        const results = await search(actualQuery, false);
        displayResults(results);
      } else {
        console.log("Lütfen aramak istediğiniz metni yazın: /tek <soru>");
      }
      askQuestion();
      return;
    }

    // Yardım
    if (query === "/help" || query === "/yardım") {
      showHelp();
      askQuestion();
      return;
    }

    // Normal soru sorma
    if (query === "") {
      console.log(
        "Lütfen bir soru sorun veya komut kullanın. Yardım için /help yazın."
      );
      askQuestion();
      return;
    }

    console.log("🧠 Düşünüyorum...");
    const results = await search(query, true);
    displayResults(results);
    askQuestion(); // Ask another question
  });
}

function showHelp() {
  console.log("\n📖 Kullanılabilir Komutlar:");
  console.log("  /yeni [isim]       - Yeni konuşma oturumu oluştur");
  console.log("  /oturumlar         - Mevcut oturumları listele");
  console.log("  /tek <soru>        - Oturumsuz tek arama yap");
  console.log("  /help              - Bu yardım menüsünü göster");
  console.log("  exit/quit/çıkış    - Programdan çık");
  console.log(
    "\n💡 İpucu: Oturum oluşturduktan sonra sorularınız konuşma geçmişi ile birlikte değerlendirilir."
  );
}

async function startApp() {
  console.log("🚀 Vertex AI Multi-Turn Arama Motoru CLI İstemcisi");
  console.log("====================================================");
  console.log("✨ Yeni Özellikler:");
  console.log("   🔗 Multi-turn konuşma desteği");
  console.log("   📝 Oturum yönetimi");
  console.log("   🧠 Konuşma geçmişi ile bağlamsal aramalar");
  console.log("\n💡 Başlamak için:");
  console.log("   - Önce '/yeni' yazarak bir oturum oluşturun");
  console.log("   - Veya direkt soru sorarak oturumsuz arama yapın");
  console.log("   - Yardım için '/help' yazın");
  console.log("\n" + "=".repeat(50));

  askQuestion();
}

startApp();
