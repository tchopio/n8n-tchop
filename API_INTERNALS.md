# What gets exposed when we publish this package

## What users see in the n8n UI

When someone installs `n8n-nodes-tchop`, they get:

- **13 nodes** in their n8n node palette (see README for the full list)
- A **Tchop API credential** form asking for: Organisation Token, User Token, Base URL, Sub-domain

That's it from the user's perspective. They configure credentials, drag nodes into workflows, done.

## What's in the published npm package

The `dist/` folder — compiled JavaScript only. No source TypeScript, no tests, no internal docs.

## What the code reveals about our API

Anyone can read the compiled JS (or this source repo if public). Here's what they'd learn:

### API surface exposed

| What | Details |
|---|---|
| **GraphQL endpoint** | `/api/graphql/webapp` |
| **REST endpoints** | `/api/v4/channels/{id}`, `/api/v4/stories/{id}/items` |
| **Upload endpoint** | `/api/fs/upload/image`, `/api/fs/upload/audio` |

### Authentication scheme

| What | Details |
|---|---|
| **Auth headers** | `x-tchop-app-organisation-token`, `x-tchop-token`, `x-tchop-webapp-organisation` |
| **Cookie** | `mz-account={token}` |
| **Bearer token** | `Authorization: Bearer {token}` |

### GraphQL operations visible in the code

| Type | Operations |
|---|---|
| **Queries** | List channels, list stories by channel, get current user |
| **Mutations** | Create card (article/post/audio/social), parse URL, delete card |
| **Schema fragments** | Field names for story cards, channels, errors — partial schema structure |

### What is NOT exposed

- No API keys, tokens, or secrets (those come from user credentials at runtime)
- No internal business logic beyond what the nodes do
- No admin or user-management endpoints
- No database structure
- Default base URL is `https://app.tchop.io` (set as the credential default — **consider changing to production before publishing**)

## Things to decide before publishing

1. **Default base URL** — currently defaults to `https://app.tchop.io` in the credential form. Should this be production instead?
2. **Repository visibility** — `package.json` points to `https://github.com/tchop-io/n8n-nodes-tchop.git`. Will that repo be public?
3. **npm scope** — currently published as `n8n-nodes-tchop` (no scope). Fine for community nodes.
