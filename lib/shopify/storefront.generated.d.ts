/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type GetCatalogProductsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  query?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
}>;


export type GetCatalogProductsQuery = { products: { edges: Array<(
      Pick<StorefrontTypes.ProductEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType' | 'tags' | 'availableForSale'>
        & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> }, options: Array<(
          Pick<StorefrontTypes.ProductOption, 'id' | 'name'>
          & { optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>> }
        )>, collections: { nodes: Array<Pick<StorefrontTypes.Collection, 'handle' | 'title'>>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> }, variants: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, edges: Array<{ node: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale' | 'quantityAvailable'>
              & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
            ) }> } }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type GetProductCollectionsQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  after: StorefrontTypes.Scalars['String']['input'];
}>;


export type GetProductCollectionsQuery = { product?: StorefrontTypes.Maybe<{ collections: { nodes: Array<Pick<StorefrontTypes.Collection, 'handle' | 'title'>>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } }> };

export type GetCatalogFacetsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  query?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetCatalogFacetsQuery = { products: { edges: Array<(
      Pick<StorefrontTypes.ProductEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Product, 'handle'>
        & { options: Array<(
          Pick<StorefrontTypes.ProductOption, 'name'>
          & { optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, 'name'>> }
        )>, collections: { nodes: Array<Pick<StorefrontTypes.Collection, 'handle' | 'title'>>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

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
        & { dropStatus?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, dropDate?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, archivedAt?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>> }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type CollectionPredictiveSearchQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  limit?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Int']['input']>;
}>;


export type CollectionPredictiveSearchQuery = { predictiveSearch?: StorefrontTypes.Maybe<{ collections: Array<(
      Pick<StorefrontTypes.Collection, 'id' | 'handle' | 'title'>
      & { dropStatus?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, dropDate?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, archivedAt?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>> }
    )> }> };

export type GetLooksQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
}>;


export type GetLooksQuery = { metaobjects: { nodes: Array<(
      Pick<StorefrontTypes.Metaobject, 'handle'>
      & { title?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MetaobjectField, 'value'>>, image?: StorefrontTypes.Maybe<{ reference?: StorefrontTypes.Maybe<{ image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }> }>, products?: StorefrontTypes.Maybe<{ references?: StorefrontTypes.Maybe<{ nodes: Array<(
            Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType' | 'tags'>
            & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> }, options: Array<(
              Pick<StorefrontTypes.ProductOption, 'id' | 'name'>
              & { optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>> }
            )>, variants: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, edges: Array<{ node: (
                  Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale' | 'quantityAvailable'>
                  & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
                ) }> } }
          )> }> }> }
    )> } };

export type GetProductQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
}>;


export type GetProductQuery = { product?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType' | 'tags'>
    & { materials?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'type' | 'value'>>, fit?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'type' | 'value'>>, care?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'type' | 'value'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> }, options: Array<(
      Pick<StorefrontTypes.ProductOption, 'id' | 'name'>
      & { optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>> }
    )>, variants: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, edges: Array<{ node: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale' | 'quantityAvailable'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        ) }> } }
  )> };

export type GetProductVariantsQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  after: StorefrontTypes.Scalars['String']['input'];
}>;


export type GetProductVariantsQuery = { product?: StorefrontTypes.Maybe<{ variants: { pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'>, edges: Array<{ node: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale' | 'quantityAvailable'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        ) }> } }> };

export type GetProductsByCollectionQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetProductsByCollectionQuery = { collection?: StorefrontTypes.Maybe<{ products: { edges: Array<(
        Pick<StorefrontTypes.ProductEdge, 'cursor'>
        & { node: (
          Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType' | 'tags'>
          & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> } }
        ) }
      )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } }> };

export type GetClosetProductsQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
}>;


export type GetClosetProductsQuery = { collection?: StorefrontTypes.Maybe<{ products: { edges: Array<{ node: (
          Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'description' | 'productType'>
          & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> }, options: Array<(
            Pick<StorefrontTypes.ProductOption, 'name'>
            & { optionValues: Array<{ swatch?: StorefrontTypes.Maybe<Pick<StorefrontTypes.ProductOptionValueSwatch, 'color'>> }> }
          )>, media: { edges: Array<{ node: { sources: Array<Pick<StorefrontTypes.Model3dSource, 'url' | 'format'>> } }> } }
        ) }> } }> };

export type GetCollectionProductListItemsQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetCollectionProductListItemsQuery = { collection?: StorefrontTypes.Maybe<{ products: { edges: Array<(
        Pick<StorefrontTypes.ProductEdge, 'cursor'>
        & { node: (
          Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'productType' | 'tags' | 'availableForSale'>
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

export type PredictiveSearchQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  limit?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Int']['input']>;
}>;


export type PredictiveSearchQuery = { predictiveSearch?: StorefrontTypes.Maybe<{ products: Array<(
      Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'productType' | 'tags' | 'availableForSale'>
      & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> } }
    )> }> };

export type GetFullSearchQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  collectionQuery: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  productAfter?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  collectionAfter?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
}>;


export type GetFullSearchQuery = { products: { edges: Array<(
      Pick<StorefrontTypes.SearchResultItemEdge, 'cursor'>
      & { node: { __typename: 'Article' | 'Page' } | (
        { __typename: 'Product' }
        & Pick<StorefrontTypes.Product, 'id' | 'handle' | 'title' | 'productType' | 'tags' | 'availableForSale'>
        & { priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'> }> } }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> }, collections: { edges: Array<(
      Pick<StorefrontTypes.CollectionEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Collection, 'id' | 'handle' | 'title'>
        & { dropStatus?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, dropDate?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>>, archivedAt?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, 'value'>> }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

interface GeneratedQueryTypes {
  "#graphql\n  query GetCatalogProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {\n    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {\n      edges {\n        cursor\n        node {\n          id handle title description productType tags availableForSale\n          priceRange { minVariantPrice { amount currencyCode } }\n          images(first: 2) { edges { node { url altText width height } } }\n          options { id name optionValues { id name } }\n          collections(first: 250) { nodes { handle title } pageInfo { hasNextPage endCursor } }\n          variants(first: 100) {\n            pageInfo { hasNextPage endCursor }\n            edges {\n              node {\n                id title availableForSale quantityAvailable\n                price { amount currencyCode }\n                selectedOptions { name value }\n              }\n            }\n          }\n        }\n      }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n": {return: GetCatalogProductsQuery, variables: GetCatalogProductsQueryVariables},
  "#graphql\n  query GetProductCollections($handle: String!, $after: String!) {\n    product(handle: $handle) {\n      collections(first: 250, after: $after) {\n        nodes { handle title }\n        pageInfo { hasNextPage endCursor }\n      }\n    }\n  }\n": {return: GetProductCollectionsQuery, variables: GetProductCollectionsQueryVariables},
  "#graphql\n  query GetCatalogFacets($first: Int!, $after: String, $query: String) {\n    products(first: $first, after: $after, query: $query) {\n      edges {\n        cursor\n        node {\n          handle\n          options { name optionValues { name } }\n          collections(first: 250) { nodes { handle title } pageInfo { hasNextPage endCursor } }\n        }\n      }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n": {return: GetCatalogFacetsQuery, variables: GetCatalogFacetsQueryVariables},
  "#graphql\n  query GetCollection($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") {\n        value\n      }\n      dropDate: metafield(namespace: \"custom\", key: \"drop_date\") {\n        value\n      }\n      archivedAt: metafield(namespace: \"custom\", key: \"archived_at\") {\n        value\n      }\n      products(first: $first, after: $after) {\n        edges {\n          cursor\n          node {\n            id\n            handle\n            title\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {return: GetCollectionQuery, variables: GetCollectionQueryVariables},
  "#graphql\n  query GetCollections($first: Int!, $after: String) {\n    collections(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          handle\n          title\n          dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") {\n            value\n          }\n          dropDate: metafield(namespace: \"custom\", key: \"drop_date\") {\n            value\n          }\n          archivedAt: metafield(namespace: \"custom\", key: \"archived_at\") {\n            value\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: GetCollectionsQuery, variables: GetCollectionsQueryVariables},
  "#graphql\n  query CollectionPredictiveSearch($query: String!, $limit: Int) {\n    predictiveSearch(query: $query, limit: $limit, types: [COLLECTION]) {\n      collections {\n        id\n        handle\n        title\n        dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") {\n          value\n        }\n        dropDate: metafield(namespace: \"custom\", key: \"drop_date\") {\n          value\n        }\n        archivedAt: metafield(namespace: \"custom\", key: \"archived_at\") {\n          value\n        }\n      }\n    }\n  }\n": {return: CollectionPredictiveSearchQuery, variables: CollectionPredictiveSearchQueryVariables},
  "#graphql\n  query GetLooks($first: Int!) {\n    metaobjects(type: \"look\", first: $first) {\n      nodes {\n        handle\n        title: field(key: \"title\") {\n          value\n        }\n        image: field(key: \"image\") {\n          reference {\n            ... on MediaImage {\n              image {\n                url\n                altText\n                width\n                height\n              }\n            }\n          }\n        }\n        products: field(key: \"products\") {\n          references(first: 8) {\n            nodes {\n              ... on Product {\n                id\n                handle\n                title\n                description\n                productType\n                tags\n                priceRange {\n                  minVariantPrice {\n                    amount\n                    currencyCode\n                  }\n                }\n                images(first: 10) {\n                  edges {\n                    node {\n                      url\n                      altText\n                      width\n                      height\n                    }\n                  }\n                }\n                options {\n                  id\n                  name\n                  optionValues {\n                    id\n                    name\n                  }\n                }\n                variants(first: 100) {\n                  pageInfo { hasNextPage endCursor }\n                  edges {\n                    node {\n                      id\n                      title\n                      availableForSale\n                      quantityAvailable\n                      image { url altText width height }\n                      price {\n                        amount\n                        currencyCode\n                      }\n                      selectedOptions {\n                        name\n                        value\n                      }\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetLooksQuery, variables: GetLooksQueryVariables},
  "#graphql\n  query GetProduct($handle: String!) {\n    product(handle: $handle) {\n      id\n      handle\n      title\n      description\n      productType\n      tags\n      materials: metafield(namespace: \"custom\", key: \"materials\") {\n        type\n        value\n      }\n      fit: metafield(namespace: \"custom\", key: \"fit\") {\n        type\n        value\n      }\n      care: metafield(namespace: \"custom\", key: \"care\") {\n        type\n        value\n      }\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      images(first: 10) {\n        edges {\n          node {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n      options {\n        id\n        name\n        optionValues {\n          id\n          name\n        }\n      }\n      variants(first: 100) {\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n        edges {\n          node {\n            id\n            title\n            availableForSale\n            quantityAvailable\n            image {\n              url\n              altText\n              width\n              height\n            }\n            price {\n              amount\n              currencyCode\n            }\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetProductQuery, variables: GetProductQueryVariables},
  "#graphql\n  query GetProductVariants($handle: String!, $after: String!) {\n    product(handle: $handle) {\n      variants(first: 100, after: $after) {\n        pageInfo { hasNextPage endCursor }\n        edges {\n          node {\n            id title availableForSale quantityAvailable\n            image { url altText width height }\n            price { amount currencyCode }\n            selectedOptions { name value }\n          }\n        }\n      }\n    }\n  }\n": {return: GetProductVariantsQuery, variables: GetProductVariantsQueryVariables},
  "#graphql\n  query GetProductsByCollection($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      products(first: $first, after: $after) {\n        edges {\n          cursor\n          node {\n            id\n            handle\n            title\n            description\n            productType\n            tags\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            images(first: 1) {\n              edges {\n                node {\n                  url\n                  altText\n                  width\n                  height\n                }\n              }\n            }\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {return: GetProductsByCollectionQuery, variables: GetProductsByCollectionQueryVariables},
  "#graphql\n  query GetClosetProducts($handle: String!, $first: Int!) {\n    collection(handle: $handle) {\n      products(first: $first) {\n        edges {\n          node {\n            id\n            handle\n            title\n            description\n            productType\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            images(first: 1) {\n              edges {\n                node {\n                  url\n                  altText\n                  width\n                  height\n                }\n              }\n            }\n            options(first: 5) {\n              name\n              optionValues {\n                swatch {\n                  color\n                }\n              }\n            }\n            media(first: 10) {\n              edges {\n                node {\n                  ... on Model3d {\n                    sources {\n                      url\n                      format\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetClosetProductsQuery, variables: GetClosetProductsQueryVariables},
  "#graphql\n  query GetCollectionProductListItems($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      products(first: $first, after: $after) {\n        edges {\n          cursor\n          node {\n            id\n            handle\n            title\n            productType\n            tags\n            availableForSale\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            images(first: 2) {\n              edges {\n                node {\n                  url\n                  altText\n                  width\n                  height\n                }\n              }\n            }\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {return: GetCollectionProductListItemsQuery, variables: GetCollectionProductListItemsQueryVariables},
  "#graphql\n  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {\n    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {\n      edges {\n        cursor\n        node {\n          id\n          handle\n          title\n          productType\n          tags\n          availableForSale\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          images(first: 2) {\n            edges {\n              node {\n                url\n                altText\n                width\n                height\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: GetProductsQuery, variables: GetProductsQueryVariables},
  "#graphql\n  query PredictiveSearch($query: String!, $limit: Int) {\n    predictiveSearch(query: $query, limit: $limit, types: [PRODUCT]) {\n      products {\n        id\n        handle\n        title\n        productType\n        tags\n        availableForSale\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        images(first: 2) {\n          edges {\n            node {\n              url\n              altText\n              width\n              height\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: PredictiveSearchQuery, variables: PredictiveSearchQueryVariables},
  "#graphql\n  query GetFullSearch($query: String!, $collectionQuery: String!, $first: Int!, $productAfter: String, $collectionAfter: String) {\n    products: search(query: $query, first: $first, after: $productAfter, types: [PRODUCT], prefix: LAST, sortKey: RELEVANCE, unavailableProducts: LAST) {\n      edges {\n        cursor\n        node {\n          __typename\n          ... on Product {\n            id\n            handle\n            title\n            productType\n            tags\n            availableForSale\n            priceRange { minVariantPrice { amount currencyCode } }\n            images(first: 2) { edges { node { url altText width height } } }\n          }\n        }\n      }\n      pageInfo { hasNextPage endCursor }\n    }\n    collections(query: $collectionQuery, first: $first, after: $collectionAfter, sortKey: RELEVANCE) {\n      edges {\n        cursor\n        node {\n          id\n          handle\n          title\n          dropStatus: metafield(namespace: \"custom\", key: \"drop_status\") { value }\n          dropDate: metafield(namespace: \"custom\", key: \"drop_date\") { value }\n          archivedAt: metafield(namespace: \"custom\", key: \"archived_at\") { value }\n        }\n      }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n": {return: GetFullSearchQuery, variables: GetFullSearchQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/storefront-api-client' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
