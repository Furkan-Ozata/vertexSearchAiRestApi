# Vertex AI Search REST API

Bu proje, Google Cloud Vertex AI Search (Discovery Engine API) ile etkileşime geçen basit bir REST API ve interaktif bir komut satırı istemcisi içerir. API, kullanıcı sorguları ile Google Cloud Vertex AI Search'e istek gönderir ve sonuçları formatlı bir şekilde döner.

## Proje Yapısı

Projenin dosya yapısı aşağıdaki gibidir:

```
vertexSearchAiRestApi/
│
├── index.js                # Ana API sunucu dosyası
├── interactive-client.js   # Komut satırı istemcisi
├── .env                    # Çevre değişkenleri dosyası
├── package.json            # Npm paket yapılandırma dosyası
└── README.md               # Proje dokümantasyonu
```

## Özellikler

- REST API ile Vertex AI Search sorguları gönderme
- İki farklı kimlik doğrulama yöntemi:
  - Google Cloud SDK (gcloud) ile kimlik doğrulama
  - Service Account JSON ile kimlik doğrulama
- Environment variables ile kolay yapılandırma
- İnteraktif komut satırı istemcisi ile test etme kolaylığı
- Axios kullanarak HTTP istekleri
- Özetleme ve alıntı desteği

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
