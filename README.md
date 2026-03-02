# n8n-nodes-tchop

Custom [n8n](https://n8n.io) nodes for integrating with the [Tchop](https://tchop.io) content management platform.

## Installation

In your n8n instance go to **Settings > Community Nodes** and install:

```
n8n-nodes-tchop
```

## Credentials

Add a **Tchop API** credential with:

| Field | Description |
|---|---|
| Organisation Token | Your organisation API token |
| User Token | Your user API token |
| Base URL | Tchop instance URL |
| Sub-domain | Organisation sub-domain, e.g. `myorg` |

## Nodes

### Content Creation

| Node | Description |
|---|---|
| **Tchop Create Article** | Create an article card in a story |
| **Tchop Create Post** | Create a post card in a story |
| **Tchop Create Audio** | Create an audio card in a story |
| **Tchop Create Social** | Create a social/quote card in a story |
| **Tchop Markdown to Post** | Convert markdown content into a Tchop post |

### Data Retrieval

| Node | Description |
|---|---|
| **Tchop Get Channels** | List channels for the organisation |
| **Tchop Get Stories** | List stories in a channel |
| **Tchop Get Story Items** | List items/cards in a story |
| **Tchop Get Content** | Get stories and their items in one call |

### Management

| Node | Description |
|---|---|
| **Tchop Delete Item** | Delete a card from a story |
| **Tchop Upload Image by URL** | Download an image from a URL and upload it to Tchop |

### Parsers (Utilities)

| Node | Description |
|---|---|
| **RSS Parser** | Fetch and parse an RSS feed with built-in deduplication |
| **Open Graph Parser** | Extract OpenGraph metadata from any webpage |

All nodes are enabled as **AI tools** so they can be used directly by n8n AI agents.

## License

[MIT](LICENSE.md)
