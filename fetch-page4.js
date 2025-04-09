// Script to fetch page 4 of tournament data from start.gg API
import { request, gql } from 'graphql-request';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if API key is available
const apiKey = process.env.START_GG_API_KEY;
if (!apiKey) {
  console.error('Error: START_GG_API_KEY not found in .env file');
  process.exit(1);
}

// Define the GraphQL query based on template-query.md
const query = gql`
  query TriPointProjectPlusEvents($perPage: Int!, $page: Int!, $searchTerm: String!, $videogameId: ID!) {
    tournaments(query: {
      perPage: $perPage,
      page: $page,
      filter: {
        name: $searchTerm
      }
    }) {
      nodes {
        id
        name
        slug
        startAt
        endAt
        events(filter: {
          videogameId: [$videogameId]
        }) {
          id
          name
          slug
          startAt
          numEntrants
          state
          standings(query: { page: 1, perPage: 8 }) {
            nodes {
              placement
              entrant {
                name
              }
            }
          }
        }
      }
      pageInfo {
        totalPages
        page
        perPage
      }
    }
  }
`;

// Variables for the query
const variables = {
  "searchTerm": "Tripoint",
  "videogameId": 33602,
  "perPage": 25,
  "page": 8
};

// API endpoint
const endpoint = 'https://api.start.gg/gql/alpha';

// Make the request
async function fetchData() {
  try {
    console.log('Fetching page 4 data from start.gg API...');
    const data = await request({
      url: endpoint,
      document: query,
      variables: variables,
      requestHeaders: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Write response to file
    const outputFile = 'page8-response.json';
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`Response saved to ${outputFile}`);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    if (error.response?.errors) {
      console.error('GraphQL errors:', error.response.errors);
    }
  }
}

// Execute the function
fetchData();