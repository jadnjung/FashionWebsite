// #graphql-tagged query documents for Collection data. graphql-codegen
// (.graphqlrc.ts) scans this file and generates matching TypeScript
// types into storefront.generated.d.ts (query/variable types) and
// storefront.types.d.ts (full schema types) — never hand-edit those.

export const GET_COLLECTION_QUERY = `#graphql
  query GetCollection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      dropStatus: metafield(namespace: "custom", key: "drop_status") {
        value
      }
      dropDate: metafield(namespace: "custom", key: "drop_date") {
        value
      }
      archivedAt: metafield(namespace: "custom", key: "archived_at") {
        value
      }
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            handle
            title
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const GET_COLLECTIONS_QUERY = `#graphql
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          title
          dropStatus: metafield(namespace: "custom", key: "drop_status") {
            value
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
