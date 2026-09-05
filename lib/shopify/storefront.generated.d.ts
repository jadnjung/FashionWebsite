/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type GetCollectionQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetCollectionQuery = { collection?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Collection, 'id' | 'handle' | 'title' | 'description'>
    & { dropStatus?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, dropDate?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, archivedAt?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, products: { edges: Array<(
        Pick<StorefrontTypes.ProductEdge, 'cursor'>
        & { node: Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title'> }
      )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } }
  )> };

export type GetCollectionsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetCollectionsQuery = { collections: { edges: Array<(
      Pick<StorefrontTypes.CollectionEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Collection, 'id' | 'handle' | 'title'>
        & { dropStatus?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>> }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type GetProductQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
}>;


export type GetProductQuery = { product?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType' | 'tags'>
    & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> }, variants: { edges: Array<{ node: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        ) }> } }
  )> };

export type GetProductsByCollectionQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetProductsByCollectionQuery = { collection?: StorefrontTypes.Maybe<{ products: { edges: Array<(
        Pick<StorefrontTypes.ProductEdge, 'cursor'>
        & { node: (
          Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'productType' | 'tags'>
          & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> } }
        ) }
      )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } }> };

export type GetProductsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  query?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
}>;


export type GetProductsQuery = { products: { edges: Array<(
      Pick<StorefrontTypes.ProductEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'productType' | 'tags' | 'availableForSale'>
        & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> } }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

interface GeneratedQueryTypes {
  "#graphql\n  query GetCollection($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") {\n        value\n      }\n      dropDate: metafield(namespace: \"custom\", key: \"drop_date\") {\n        value\n      }\n      archivedAt: metafield(namespace: \"custom\", key: \"archived_at\") {\n        value\n      }\n      products(first: $first, after: $after) {\n        edges {\n          cursor\n          node {\n            id\n            handle\n            title\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {return: GetCollectionQuery, variables: GetCollectionQueryVariables},
  "#graphql\n  query GetCollections($first: Int!, $after: String) {\n    collections(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          handle\n          title\n          dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") {\n            value\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: GetCollectionsQuery, variables: GetCollectionsQueryVariables},
  "#graphql\n  query GetProduct($handle: String!) {\n    product(handle: $handle) {\n      id\n      handle\n      title\n      description\n      productType\n      tags\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      images(first: 10) {\n        edges {\n          node {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n      variants(first: 100) {\n        edges {\n          node {\n            id\n            title\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetProductQuery, variables: GetProductQueryVariables},
  "#graphql\n  query GetProductsByCollection($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      products(first: $first, after: $after) {\n        edges {\n          cursor\n          node {\n            id\n            handle\n            title\n            productType\n            tags\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            images(first: 1) {\n              edges {\n                node {\n                  url\n                  altText\n                  width\n                  height\n                }\n              }\n            }\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {return: GetProductsByCollectionQuery, variables: GetProductsByCollectionQueryVariables},
  "#graphql\n  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {\n    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {\n      edges {\n        cursor\n        node {\n          id\n          handle\n          title\n          productType\n          tags\n          availableForSale\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          images(first: 2) {\n            edges {\n              node {\n                url\n                altText\n                width\n                height\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: GetProductsQuery, variables: GetProductsQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/storefront-api-client' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
