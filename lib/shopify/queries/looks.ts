// Homepage "Shop the Look" ring (DECISIONS.md D-091). Looks are curated in
// Shopify admin as metaobjects of type "look" (fields: title, image — a
// file reference — and products — a product-reference list), with the
// definition's Storefront access set to public read. Product fields mirror
// GET_PRODUCT_QUERY (options + variants) so the Shop the Look panel's
// variant pickers need no further requests. Inlined rather than shared via
// a fragment: the codegen preset reads these template literals statically.
export const GET_LOOKS_QUERY = `#graphql
  query GetLooks($first: Int!) {
    metaobjects(type: "look", first: $first) {
      nodes {
        handle
        title: field(key: "title") {
          value
        }
        image: field(key: "image") {
          reference {
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
        products: field(key: "products") {
          references(first: 8) {
            nodes {
              ... on Product {
                id
                handle
                title
                description
                productType
                tags
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 10) {
                  edges {
                    node {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                options {
                  id
                  name
                  optionValues {
                    id
                    name
                  }
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      quantityAvailable
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
