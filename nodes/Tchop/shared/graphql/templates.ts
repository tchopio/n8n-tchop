export const STORY_CARD_POST_IN_STORY_MUTATION = `
mutation StoryCardPostInStory($input: StoryCardPostInStoryInput!) {
  storyCardPostInStory(input: $input) {
    payload {
      id
      type
      storyId
      content {
        ... on StoryCardThreadContent { title }
        ... on StoryCardEditorialContent { headline text }
        ... on StoryCardArticleContent { title url }
        ... on StoryCardPostContent {
          title
          abstract
          headline
          contentAuthor
          contentReadTime
          sourceName
        }
      }
    }
    error {
      __typename
      ... on StoryCardPostContentValidationError { message }
      ... on StoryCardUrlUniquenessConflictError { message }
      ... on StoryCardValidationError { details { message path type } }
      ... on StoryReadOnlyAccessError { message }
      ... on UnknownError { message }
    }
  }
}
`;

export const STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION = `
mutation StoryCardPostInStory($input: StoryCardPostInStoryInput!) {
  storyCardPostInStory(input: $input) {
    payload {
      id
    }
    error {
      __typename
      ... on StoryCardPostContentValidationError { message }
      ... on StoryCardValidationError { details { message path type } }
      ... on StoryReadOnlyAccessError { message }
      ... on UnknownError { message }
    }
  }
}
`;

export const STORY_CARD_PARSE_URL_MUTATION = `
mutation StoryCardParseUrl($input: StoryCardParseUrlInput!) {
  storyCardParseUrl(input: $input) {
    payload {
      ... on StoryCardArticleParsedUrl {
        type
        gallery {
          image {
            id
          }
        }
      }
      ... on StoryCardQuoteParsedUrl {
        type
        gallery {
          image {
            id
          }
        }
      }
      ... on StoryCardImageParsedUrl {
        type
        gallery {
          image {
            id
          }
        }
      }
    }
  }
}
`;

export const STORY_CARD_DELETE_MUTATION = `
mutation StoryCardDelete($input: StoryCardDeleteInput!) {
  storyCardDelete(input: $input) {
    payload
    error {
      __typename
      ... on StoryCardNotFoundError { message }
      ... on StoryReadOnlyAccessError { message }
      ... on UnknownError { kind message }
    }
  }
}
`;

export const GET_CHANNELS_QUERY = `
query GetChannels {
  channels {
    id
    name
    subdomain
  }
}
`;

export const GET_STORY_CARDS_FEED_QUERY = `
query GetStoryCardsFeed($storyId: Int!, $orderDirection: OrderDirectionEnum!, $page: Int, $size: Int, $filter: GetStoryCardsFeedFilterArgs) {
  storyCardsFeed(storyId: $storyId, orderDirection: $orderDirection, page: $page, size: $size, filter: $filter) {
    payload {
      items {
        id
        type
        storyId
        position
        postedAt
        createdAt
        updatedAt
        commentsCount
        status
        author {
          screenName
        }
        content {
          ... on StoryCardArticleContent {
            title
            url
            headline
            abstract
            contentAuthor
            contentReadTime
            sourceName
            gallery { image { url } }
          }
          ... on StoryCardPostContent {
            title
            headline
            abstract
            contentAuthor
            contentReadTime
            sourceName
            gallery { image { url } }
          }
          ... on StoryCardEditorialContent {
            headline
            sourceName
            text
          }
          ... on StoryCardThreadContent {
            title
          }
          ... on StoryCardAudioContent {
            headline
            sourceName
            text
          }
          ... on StoryCardImageContent {
            headline
            sourceName
            text
            gallery { image { url } }
          }
          ... on StoryCardVideoContent {
            headline
            sourceName
            text
          }
          ... on StoryCardQuoteContent {
            headline
            quote
            quotePerson
            quoteSource
            url
          }
          ... on StoryCardPollContent {
            headline
            text
          }
          ... on StoryCardPdfContent {
            headline
            sourceName
            text
          }
        }
      }
      pageInfo {
        hasNextPage
        page
        totalItems
        totalPages
      }
    }
    error {
      __typename
      ... on StoryNotFoundError { message }
    }
  }
}
`;

export const GET_STORIES_BY_CHANNEL_ID_QUERY = `
query GetStoriesByChannelId($channelId: Int!, $filter: GetStoriesByChannelIdFilterArgs) {
  storiesByChannelId(channelId: $channelId, filter: $filter) {
    items {
      id
      title
      subtitle
      cardsCount
      status
      isReadOnly
    }
  }
}
`;
