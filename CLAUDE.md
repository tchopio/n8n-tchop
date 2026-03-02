# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**n8n-nodes-tchop** is a custom n8n community node package that integrates the Tchop content management platform with n8n workflow automation. It provides nodes for creating content (articles, posts, digests, audio, social), retrieving data (channels, stories, story items), parsing external content (RSS, OpenGraph, Instagram), and summarizing articles via OpenAI.

## Commands

```bash
npm run dev          # Start n8n with nodes loaded + hot reload (http://localhost:5678)
npm run build        # Compile TypeScript to dist/
npm run lint         # Check code with n8n's ESLint rules
npm run lint:fix     # Auto-fix lint issues
```

No automated test runner is configured. Testing is done manually via `npm run dev`.

## Architecture

### Node Organization

```
nodes/
├── Tchop/                    # Tchop API nodes
│   ├── TchopCreate*/         # Content creation nodes (Article, Audio, Digest, Post, Social)
│   ├── TchopGet*/            # Data retrieval nodes (Channels, Stories, StoryItems, Content)
│   ├── TchopUploadImageByUrl/
│   ├── api/                  # API client layer
│   │   ├── client.ts         # buildTchopHeaders(), tchopGraphQLRequest()
│   │   ├── create_article.ts # Article creation logic
│   │   ├── create_audio.ts
│   │   ├── create_social_post.ts
│   │   ├── upload.ts         # File upload utilities (image/audio, URL or Buffer)
│   │   └── inputs.ts         # Shared input interfaces
│   └── shared/
│       ├── GenericFunctions.ts   # tchopApiRequest() for REST calls
│       ├── SanitizeFunctions.ts  # Content sanitization
│       ├── graphql/              # GraphQL query/mutation strings
│       │   ├── templates.ts      # Main mutations (StoryCardPostInStory, etc.)
│       │   ├── channels.ts, stories.ts, post.ts, etc.
│       │   └── schema.json       # GraphQL schema reference
│       └── icons/
├── Parsers/                  # External content parsing nodes
│   ├── RssParser/
│   ├── OpenGraphParser/
│   └── InstagramParser/
└── Summarizer/
    └── ArticleSummarizer/    # OpenAI-powered article summarization
```

### Key Patterns

**Node structure:** Each node implements `INodeType` with a `description` (UI config, parameters, credentials) and an async `execute()` method. All Tchop nodes use `usableAsTool: true`.

**API communication:** Tchop API uses GraphQL exclusively via `tchopGraphQLRequest()` in `api/client.ts`. GraphQL queries/mutations are string templates in `shared/graphql/`. REST is available via `tchopApiRequest()` in `shared/GenericFunctions.ts` but rarely used.

**Authentication:** Custom headers (`x-tchop-app-id`, `x-tchop-app-organisation-token`, `x-tchop-token`, etc.) built by `buildTchopHeaders()`. Credentials stored via n8n's credential system (`tchopApi`).

**File uploads:** Images and audio go through `/api/fs/upload/{type}` REST endpoint. The `upload.ts` module handles downloading from URL, converting to Buffer, and uploading via FormData.

**Error handling:** Nodes support `continueOnFail()` for resilient workflows. GraphQL errors are parsed from response and re-thrown.

### Credentials

- **TchopApi** (`credentials/TchopApi.credentials.ts`) — Organisation Token, User Token, Base URL, Sub-domain

### Adding a New Node

1. Create a folder under the appropriate category in `nodes/`
2. Implement `INodeType` with `description` and `execute()`
3. For Tchop API nodes, use `tchopGraphQLRequest()` from `api/client.ts`
4. Register the node's dist path in `package.json` under `n8n.nodes`
5. Run `npm run lint:fix && npm run build`

## Code Style

- TypeScript strict mode, tabs for indentation, single quotes, semicolons, trailing commas
- Prettier (100 char width) and ESLint (n8n plugin rules) enforced
- Node.js v22+ required
