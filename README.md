# Vertex AI Search REST API - Multi-Turn Konuşma Desteği

Bu proje, Google Cloud Vertex AI Search (Discovery Engine API) ile etkileşime geçen gelişmiş bir REST API ve interaktif komut satırı istemcisi içerir. API, hem tek seferlik aramalar hem de multi-turn konuşma oturumları ile Google Cloud Vertex AI Search'e istek gönderir ve sonuçları formatlı bir şekilde döner.

## 🆕 Yeni Özellikler

### Multi-Turn Search (Çok Turlu Arama)

- **Konuşma Oturumları**: Birden fazla soruyu art arda sorarak bağlamsal aramalar yapın
- **SessionSpec API**: Google Cloud'un SessionSpec özelliği ile arama sonuçlarını oturum boyunca persist edin
- **Oturum Yönetimi**: Oturum oluşturma, listeleme ve takip etme
- **Bağlamsal Anlayış**: Önceki sorular ve cevapların bağlamında yeni aramalar

### Gelişmiş API Endpoints

- `POST /search` - Tek seferlik arama veya oturum bazlı arama
- `POST /session` - Yeni konuşma oturumu oluşturma
- `GET /sessions` - Mevcut oturumları listeleme
- `GET /session/:sessionId` - Tek oturum detayları

## Proje Yapısı

```
vertexSearchAiRestApi/
│
├── index.js                # Ana API sunucu dosyası (Multi-turn desteği ile)
├── interactive-client.js   # Gelişmiş komut satırı istemcisi
├── .env                    # Çevre değişkenleri dosyası
├── package.json            # Npm paket yapılandırma dosyası
└── README.md               # Proje dokümantasyonu
```

## Özellikler

### Temel Özellikler

- REST API ile Vertex AI Search sorguları gönderme
- İki farklı kimlik doğrulama yöntemi:
  - Google Cloud SDK (gcloud) ile kimlik doğrulama
  - Service Account JSON ile kimlik doğrulama
- Environment variables ile kolay yapılandırma
- Axios kullanarak HTTP istekleri
- Özetleme ve alıntı desteği

### Gelişmiş Özellikler

- **Multi-Turn Search**: Konuşma geçmişi ile bağlamsal aramalar
- **Session Management**: Oturum oluşturma ve yönetimi
- **SessionSpec Integration**: Google Cloud'un session API'si ile entegrasyon
- **Turn Tracking**: Her konuşma turunu takip etme
- **Interactive Commands**: Zengin komut satırı arayüzü

## Ön Gereksinimler

- Node.js ve npm (LTS sürümü önerilir)
- Google Cloud hesabı
- Vertex AI Search (Discovery Engine) etkinleştirilmiş proje
- Aşağıdakilerden en az biri:
  - Yüklü ve kimlik doğrulaması yapılmış Google Cloud SDK (`gcloud`)
  - Service Account JSON kimlik bilgileri

1.  **Clone the repository (if applicable) or download the project files.**

    ## Kurulum

### 1. Projeyi İndirme

```bash
# Repoyu klonlayın (eğer bir Git reposundan alıyorsanız)
git clone <repository-url>
cd vertexSearchAiRestApi

# Ya da arşivden çıkartın ve klasöre gidin
cd vertexSearchAiRestApi
```

### 2. Bağımlılıkları Yükleme

```bash
npm install
```

### 3. .env Dosyasını Oluşturma

Proje ana dizininde `.env` adında bir dosya oluşturun ve aşağıdaki şablonu kullanarak kendi değerlerinizle doldurun:

```env
# Google Cloud Proje Bilgileri
PROJECT_ID="your-gcp-project-id"         # Google Cloud Proje ID'niz
LOCATION="global"                        # Kullandığınız bölge (genellikle "global" veya "us-central1" vs.)
COLLECTION_ID="default_collection"       # Vertex AI Search koleksiyon ID'si
ENGINE_ID="your-engine-id"               # Vertex AI Search motor ID'niz
SERVING_CONFIG_ID="default_search"       # Serving config ID (genellikle "default_search")

# Dil ve Bölge Ayarları
LANGUAGE_CODE="en-US"                    # Sorguların dili (veya "tr-TR" gibi)
TIME_ZONE="Europe/Istanbul"              # Zaman dilimi

# API Yapılandırması
PORT=3000                                # API'nin çalışacağı port
API_URL="http://localhost:3000/search"   # API URL'i

# Özel Yapılandırma
PREAMBLE="Özet oluşturma için sistem talimatları buraya yazılır. Sistemin nasıl davranacağını belirten detaylı talimatlar verilebilir."

# Google Service Account Bilgileri (Opsiyonel - gcloud CLI kullanamıyorsanız gereklidir)
SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_DATA_HERE\\n-----END PRIVATE KEY-----\\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account@your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'
```

#### Service Account JSON Hazırlama

Eğer `gcloud CLI` kullanmak yerine Service Account ile kimlik doğrulama yapmak isterseniz:

1. Google Cloud Console'a gidin: https://console.cloud.google.com
2. Projenizi seçin
3. "IAM & Admin" > "Service Accounts" bölümüne gidin
4. "Create Service Account" butonuna tıklayın
5. Service Account için bir isim ve açıklama girin
6. "Create and Continue" butonuna tıklayın
7. Role olarak "Discovery Engine Service Agent", "Discovery Engine Viewer" ve "Discovery Engine Editor" rollerini ekleyin
8. "Continue" ve sonra "Done" butonlarına tıklayın
9. Oluşturulan service account'a tıklayın
10. "Keys" sekmesine gidin ve "Add Key" > "Create new key" seçin
11. "JSON" formatını seçin ve "Create" butonuna tıklayın
12. İndirilen JSON dosyasının içeriğini .env dosyasındaki SERVICE_ACCOUNT_JSON değişkenine tek tırnak içinde ekleyin

    - NOT: JSON içindeki tüm çift tırnaklar korunmalıdır
    - NOT: JSON içindeki yeni satır karakterleri `\\n` olarak yazılmalıdır (yukarıdaki örneğe bakın)
      SERVING_CONFIG_ID="default_config" # Or your specific serving config

    # Search Configuration

    LANGUAGE_CODE="en" # Or your desired language code e.g., "tr"
    TIME_ZONE="UTC" # Or your desired time zone e.g., "America/New_York", "Europe/Istanbul"
    PREAMBLE="Provide a concise answer to the user\'s query based on the search results." # Customize as needed

    # API Server Port (Optional, defaults to 3000 if not set)

    # PORT=3000

    ```

    **Important:** Ensure that `.env` is listed in your `.gitignore` file to prevent committing sensitive credentials to your repository. If it's not, add `.env` to a new line in `.gitignore`.
    ```

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

````bash
curl -X POST \
  -H "Content-Type: application/json" \
  ## API Kullanımı

API başlatıldıktan sonra aşağıdaki endpoint'leri kullanabilirsiniz:

### 1. Tek Seferlik Arama (POST /search)

Geleneksel tek seferlik arama yapmak için:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest advancements in AI?"
  }' \
  http://localhost:3000/search
````

### 2. Oturum Oluşturma (POST /session)

Multi-turn konuşma için önce bir oturum oluşturun:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "AI Research Session",
    "userPseudoId": "user_123"
  }' \
  http://localhost:3000/session
```

**Başarılı Cevap:**

```json
{
  "name": "projects/your-project/locations/global/collections/default_collection/engines/your-engine/sessions/session_id",
  "displayName": "AI Research Session",
  "userPseudoId": "user_123",
  "state": "IN_PROGRESS",
  "turns": [],
  "startTime": "2025-05-25T10:00:00Z"
}
```

### 3. Multi-Turn Arama (POST /search with sessionId)

Oluşturulan oturumla bağlamsal arama yapın:

```bash
# İlk soru
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is artificial intelligence?",
    "sessionId": "projects/your-project/locations/global/collections/default_collection/engines/your-engine/sessions/session_id",
    "searchResultPersistenceCount": 5
  }' \
  http://localhost:3000/search

# İkinci soru (önceki bağlamla)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How does it differ from machine learning?",
    "sessionId": "projects/your-project/locations/global/collections/default_collection/engines/your-engine/sessions/session_id",
    "searchResultPersistenceCount": 5
  }' \
  http://localhost:3000/search
```

### 4. Oturumları Listeleme (GET /sessions)

```bash
curl http://localhost:3000/sessions
```

### 5. Tek Oturum Bilgisi (GET /session/:sessionId)

```bash
curl http://localhost:3000/session/session_id
```

## İnteraktif İstemci Kullanımı

Komut satırı istemcisi ile kolay test edebilirsiniz:

```bash
node interactive-client.js
```

### İstemci Komutları

- `/yeni [oturum_adı]` - Yeni konuşma oturumu oluştur
- `/oturumlar` - Mevcut oturumları listele
- `/tek <soru>` - Oturumsuz tek arama yap
- `/help` - Yardım menüsünü göster
- `exit/quit/çıkış` - Programdan çık

### Örnek Kullanım Senaryosu

```
🚀 Vertex AI Multi-Turn Arama Motoru CLI İstemcisi
====================================================

🧑 Sen (Oturumsuz): /yeni AI Araştırması
✅ Yeni sohbet oturumu oluşturuldu: AI Araştırması

🧑 Sen (Oturum: AI Araştırması): Yapay zeka nedir?
🧠 Düşünüyorum...
🔗 Oturum: session_123 | Turn: 1
🤖 Cevap: Yapay zeka (AI), makinelerin insan benzeri düşünme...

🧑 Sen (Oturum: AI Araştırması): Peki makine öğrenmesi ile farkı nedir?
🧠 Düşünüyorum...
🔗 Oturum: session_123 | Turn: 2
🤖 Cevap: Makine öğrenmesi, daha önce sorduğunuz yapay zekanın bir alt dalıdır...
```

## Nasıl Çalışır

### Kimlik Doğrulama Akışı

1. **İlk deneme**: `gcloud auth print-access-token` komutu ile Google Cloud CLI üzerinden token alınmaya çalışılır
2. **Geri dönüş**: CLI başarısız olursa, `.env` dosyasındaki `SERVICE_ACCOUNT_JSON` ile servis hesabı kimlik doğrulaması yapılır
3. **GoogleAuth Library**: `google-auth-library` kullanarak programatik kimlik doğrulama

### Multi-Turn Search Akışı

1. **Session Oluşturma**: `/session` endpoint'i ile Google Cloud'da yeni bir session oluşturulur
2. **SessionSpec Kullanımı**: Her aramada `sessionId` ve `queryId` gönderilerek arama sonuçları persist edilir
3. **Turn Tracking**: Her soru-cevap bir "turn" olarak kaydedilir ve bağlam korunur
4. **Bağlamsal Arama**: Önceki sorular ve cevaplar sonraki aramalarda kullanılır

### API Entegrasyonu

- **Axios HTTP Client**: cURL yerine programatik HTTP istekleri
- **v1alpha API**: Google Cloud Discovery Engine'in en güncel özelliklerini kullanır
- **SessionSpec**: `queryId` ve `searchResultPersistenceCount` ile çok turlu aramalar
- **Error Handling**: Kapsamlı hata yönetimi ve kullanıcı dostu mesajlar

## Hata Çözüm

### Kimlik Doğrulama Hataları

```bash
# gcloud CLI'nin kurulu ve authenticate olup olmadığını kontrol edin
gcloud auth list

# Gerekirse yeniden authenticate olun
gcloud auth login

# Service account key'i doğru formatta olup olmadığını kontrol edin
echo $SERVICE_ACCOUNT_JSON | jq .
```

### API Hataları

- **403 Forbidden**: Discovery Engine API'nin projenizde etkinleştirildiğinden emin olun
- **404 Not Found**: PROJECT_ID, ENGINE_ID ve diğer ID'lerin doğru olduğunu kontrol edin
- **Session Errors**: v1alpha endpoint'lerinin kullanıldığından emin olun

### Yaygın Sorunlar

1. **Service Account JSON**: JSON string'indeki tırnak işaretlerinin escape edildiğinden emin olun
2. **Environment Variables**: .env dosyasının doğru yüklendiğini kontrol edin
3. **API Versions**: Multi-turn özellik için v1alpha kullanılması gerekir

## Katkıda Bulunma

1. Bu repository'i fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasına bakın.

## İletişim

Sorularınız için issue açabilir veya doğrudan iletişime geçebilirsiniz.

---

**Not**: Bu proje Google Cloud Vertex AI Search'ün multi-turn özelliğini kullanır. Bu özellik şu anda private GA aşamasındadır ve v1alpha/v1beta endpoint'leri gerektirir.

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
