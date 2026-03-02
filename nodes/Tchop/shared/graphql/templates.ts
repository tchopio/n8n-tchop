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
