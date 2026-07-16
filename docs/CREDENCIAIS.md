# Guia de Credenciais por Plataforma

Este documento explica exatamente o que pedir/gerar em cada plataforma para alimentar o dashboard. Preencha os valores obtidos no `.env.local` (nunca no `.env.example`, que fica versionado).

---

## 1. Meta Ads (Facebook Ads)

**API:** Marketing API (Graph API)

Passos:
1. Criar um app em https://developers.facebook.com/apps (tipo "Business").
2. Adicionar o produto **Marketing API** ao app.
3. No Business Manager do cliente, criar um **System User** com acesso a conta de anúncios (evita token expirar quando alguém troca a senha).
4. Gerar um **token de longa duração** para esse System User com as permissões:
   - `ads_read`
   - `ads_management` (se for gerenciar campanhas, não só ler)
5. Pegar o **Ad Account ID** (formato `act_XXXXXXXXXX`) em Configurações da conta de anúncios.

Credenciais necessárias:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_BUSINESS_ID`

---

## 2. Instagram Orgânico

**API:** Instagram Graph API (não confundir com a antiga Instagram Basic Display, descontinuada)

Pré-requisito: a conta do Instagram precisa ser **Business ou Creator** e estar **vinculada a uma Página do Facebook**.

Passos:
1. Usar o mesmo App do Meta acima.
2. Adicionar as permissões: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
3. Descobrir o `INSTAGRAM_BUSINESS_ACCOUNT_ID` via endpoint `/{page-id}?fields=instagram_business_account` usando o token da página.
4. Pegar o ID da Página do Facebook vinculada (`INSTAGRAM_LINKED_PAGE_ID`).

Credenciais necessárias:
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_LINKED_PAGE_ID`
- `INSTAGRAM_ACCESS_TOKEN` (pode reaproveitar o token do Meta Ads se o mesmo app tiver as permissões)

---

## 3. Google Ads

**API:** Google Ads API

Passos:
1. Solicitar um **Developer Token** em https://ads.google.com/aw/apicenter (conta MCC do cliente ou da agência). Atenção: token novo começa em modo "Test", precisa aprovação do Google para produção.
2. Criar um projeto no Google Cloud Console e habilitar a **Google Ads API**.
3. Criar credenciais **OAuth 2.0 Client ID** (tipo "Desktop app" ou "Web application").
4. Gerar um **Refresh Token** autenticando com a conta que tem acesso à conta de anúncios do cliente (fluxo OAuth2 rodado uma vez).
5. Pegar o **Customer ID** da conta de anúncios (formato `123-456-7890`, sem traços no `.env`).
6. Se o acesso for via conta gerenciadora (MCC), informar também o `LOGIN_CUSTOMER_ID` (o ID do MCC).

Credenciais necessárias:
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

---

## 4. Amazon Ads

**API:** Amazon Advertising API

> **Status atual:** a Amazon reprovou o acesso à API nativa (Advertising API) para esta conta.
> A fonte de dados em uso é o conector **Windsor.ai** (abaixo), que já tem acesso liberado do lado deles.
> Os passos nativos ficam documentados para o caso de a aprovação da Amazon ser revertida no futuro.

Passos (API nativa — atualmente não utilizável para este cliente):
1. Criar um app de segurança em https://developer.amazon.com/apps-and-games/login-with-amazon (Login with Amazon / LWA).
2. Se registrar como Advertising API developer: https://advertising.amazon.com/API/docs/en-us/get-started
3. Gerar `Client ID` e `Client Secret` do LWA.
4. Rodar o fluxo OAuth2 (autorização do cliente/anunciante) para obter o **Refresh Token**.
5. Listar os **Profiles** disponíveis (`GET /v2/profiles`) para pegar o `PROFILE_ID` correto (cada marketplace/país é um profile diferente).
6. Definir a região do endpoint: `NA` (América do Norte/Brasil), `EU` ou `FE`.

Credenciais necessárias (API nativa):
- `AMAZON_ADS_CLIENT_ID`
- `AMAZON_ADS_CLIENT_SECRET`
- `AMAZON_ADS_REFRESH_TOKEN`
- `AMAZON_ADS_PROFILE_ID`
- `AMAZON_ADS_REGION`

### 4.1 Amazon Ads via Windsor.ai (fonte real em uso)

Windsor.ai é um serviço de conectores que já tem integração aprovada com a Amazon Advertising API do lado deles — a conta se autentica uma vez no painel do Windsor e o dashboard consome os dados via REST simples (API key na query string), sem precisar do fluxo LWA.

Passos:
1. Conectar a conta Amazon Ads no painel do Windsor (https://onboarding.windsor.ai).
2. Pegar a `api_key` do Windsor no painel.
3. Endpoint: `GET https://connectors.windsor.ai/amazon_ads?api_key=...&date_preset=...&fields=...`
4. Campos usados hoje (nível campanha, Sponsored Products): ACOS, ROAS, cliques, custo, impressões, CPC, CTR, budget, status, vendas/conversões atribuídas (1d/7d/14d/30d).

Credenciais necessárias:
- `WINDSOR_API_KEY`
- `WINDSOR_AMAZON_ADS_ENDPOINT`

---

## 5. Mercado Livre Ads (Product Ads / Mercado Ads)

**API:** Mercado Livre Developers (Product Ads API)

Passos:
1. Criar uma aplicação em https://developers.mercadolivre.com.br/devcenter
2. Pegar `Client ID` (App ID) e `Client Secret`.
3. Configurar a **Redirect URI** de callback OAuth no cadastro do app.
4. Rodar o fluxo OAuth2 com o login do vendedor/anunciante para obter `Access Token` e `Refresh Token` (o access token expira em ~6h, o refresh token é usado para renovar).
5. Confirmar acesso ao **Product Ads / Mercado Ads** (em alguns casos precisa solicitar liberação da API de Ads separadamente, nem toda conta tem acesso automático).
6. Pegar o `user_id` do vendedor (`MELI_ADVERTISER_ID`) via `GET /users/me`.

Credenciais necessárias:
- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`
- `MELI_ACCESS_TOKEN`
- `MELI_REFRESH_TOKEN`
- `MELI_REDIRECT_URI`
- `MELI_ADVERTISER_ID`

---

## Resumo — o que pedir ao cliente

| Plataforma | O que o cliente precisa te dar/liberar |
|---|---|
| Meta Ads | Acesso de Admin/Analista no Business Manager (para você criar o System User e gerar token) + Ad Account ID |
| Instagram Orgânico | Confirmar que a conta é Business/Creator e está vinculada à Página do Facebook do Business Manager acima |
| Google Ads | Acesso à conta Google Ads (nível "Standard" ou superior) + Customer ID; se agência tiver MCC, vincular a conta do cliente |
| Amazon Ads | Acesso de usuário na conta Amazon Advertising do cliente para autorizar o app via LWA |
| Mercado Livre Ads | Login do vendedor para autorizar o app no fluxo OAuth + confirmar que a conta tem Mercado Ads habilitado |

## Observações de segurança

- Tokens de longa duração (Meta, Google refresh token, Amazon refresh token, MELI refresh token) são equivalentes a senha — armazenar criptografados (`ENCRYPTION_SECRET` no `.env`), nunca em texto puro em banco ou logs.
- Preferir **System Users** (Meta) e **Service Accounts/MCC** (Google) a tokens pessoais, para não quebrar quando um funcionário do cliente sai ou troca a senha.
- Todos os tokens de curta duração (access tokens) devem ser renovados automaticamente via refresh token — não depender de renovação manual.
