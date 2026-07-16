/**
 * Gera o GOOGLE_ADS_REFRESH_TOKEN via fluxo OAuth2 (authorization code) e
 * grava automaticamente em .env.local.
 *
 * Uso:
 *   node scripts/get-google-ads-refresh-token.js
 *
 * Requisitos previos em .env.local:
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *
 * O redirect URI usado (http://localhost:8080/oauth2callback) precisa estar
 * cadastrado nas "Authorized redirect URIs" do OAuth Client no Google Cloud
 * Console (APIs & Services > Credentials). Se o client for do tipo
 * "Desktop app", localhost costuma ser aceito automaticamente; se for
 * "Web application", cadastre a URI exata acima.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const ENV_PATH = path.join(__dirname, "..", ".env.local");
const REDIRECT_URI = "http://localhost:8080/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/adwords";
const PORT = 8080;

function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function upsertEnvVar(filePath, key, value) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lineRegex = new RegExp(`^${key}=.*$`, "m");
  if (lineRegex.test(content)) {
    content = content.replace(lineRegex, `${key}=${value}`);
  } else {
    content += `${content.endsWith("\n") || content === "" ? "" : "\n"}${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`Arquivo nao encontrado: ${ENV_PATH}`);
    console.error("Crie o .env.local (copie do .env.example) e preencha GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET antes de rodar este script.");
    process.exit(1);
  }

  const env = readEnvFile(ENV_PATH);
  const clientId = env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("GOOGLE_ADS_CLIENT_ID e/ou GOOGLE_ADS_CLIENT_SECRET nao encontrados em .env.local.");
    process.exit(1);
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end();
      return;
    }

    const code = reqUrl.searchParams.get("code");
    const error = reqUrl.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>Autorizacao negada: ${error}</h2><p>Pode fechar esta aba e tentar novamente.</p>`);
      console.error(`\nAutorizacao negada pelo Google: ${error}`);
      process.exitCode = 1;
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>Codigo de autorizacao ausente.</h2>");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Autorizado com sucesso!</h2><p>Pode fechar esta aba e voltar ao terminal.</p>");

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.refresh_token) {
        console.error("\nFalha ao trocar o codigo por tokens:");
        console.error(tokenData);
        process.exitCode = 1;
        return;
      }

      upsertEnvVar(ENV_PATH, "GOOGLE_ADS_REFRESH_TOKEN", tokenData.refresh_token);
      console.log("\nGOOGLE_ADS_REFRESH_TOKEN gravado em .env.local com sucesso.");
    } catch (err) {
      console.error("\nErro ao trocar o codigo por tokens:", err);
      process.exitCode = 1;
    } finally {
      // Nao forcar process.exit() aqui: em combinacao com server.close()
      // o Node crasha no Windows (assertion failure no libuv). Deixamos o
      // event loop drenar sozinho assim que o servidor terminar de fechar.
      server.close();
    }
  });

  server.listen(PORT, () => {
    console.log("Abra esta URL no navegador e faca login com a conta Google que tem acesso a conta do Google Ads:\n");
    console.log(authUrl.toString());
    console.log(`\nAguardando callback em ${REDIRECT_URI} ...`);
  });
}

main();
