/**
 * Script to fetch tournament data from start.gg API. This should be run from the root of this application (`/tourney-results`).
 *
 * Usage: node data/scripts/fetch-data.js --perPage=<number> --startPage=<number> --endPage=<number>
 *
 * --perPage: The number of tournaments to display per page of results. Defaults to 4 to avoid start.gg query limits.
 * --startPage: The starting page of tournament results to query. Defaults to 1.
 * --endPage: The ending page of tournament results to query, stopping queries once the page number exceeds this limit.
 *
 * Example: node data/scripts/fetch-data.js
 * Example: node data/scripts/fetch-data.js --startPage=48
 * Example: node data/scripts/fetch-data.js --perPage=10 --startPage=2 --endPage=5
 */
import { request, gql } from 'graphql-request';
import fs from 'fs';
import dotenv from 'dotenv';
import { getArg } from './helpers.js';

// Load environment variables
dotenv.config();

// Check if API key is available
const apiKey = process.env.START_GG_API_KEY;
if (!apiKey) {
  console.error('Error: START_GG_API_KEY not found in .env file');
  process.exit(1);
}

// Variables for the query
const baseVariables = {
  "searchTerm": "Tripoint",
  // 33602 = Project+ and 2 = Project M
  "videogameId": [33602, 2],
  // 1 = Singles
  "eventType": [1],
  "perPage": getArg('perPage', 4),
};

// Define the GraphQL query based on template-query.md
const query = gql`
  query TriPointProjectPlusEvents($perPage: Int!, $page: Int!, $searchTerm: String!, $videogameId: [ID]!, $eventType: [Int]!) {
    tournaments(query: {
      perPage: $perPage,
      page: $page,
      sortBy: "startAt asc",
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
          videogameId: $videogameId,
          type: $eventType
        }) {
          id
          name
          slug
          startAt
          numEntrants
          standings(query: { page: 1, perPage: 100 }) {
            nodes {
              placement
              entrant {
                participants {
                  user {
                    id
                    player {
                      gamerTag
                    }
                  }
                }
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

// API endpoint
const endpoint = 'https://api.start.gg/gql/alpha';

const startPage = getArg('startPage', 1);
const endPage = getArg('endPage', NaN);
if (endPage && startPage > endPage) {
  throw new Error(`Start page (${startPage}) is greater than end page (${endPage})`);
}

fetchData(startPage, endPage);

// Make the request
async function fetchData(pageNum, endPage) {
  if (endPage && pageNum > endPage) {
    console.log(`Stopping because current page is ${pageNum} and end page limit is ${endPage}`);

    return;
  }

  try {
    console.log(`Fetching page ${pageNum} data from start.gg API...`);
    const variables = {
      ...baseVariables,
      "page": pageNum,
    };

    const data = await request({
      url: endpoint,
      document: query,
      variables: variables,
      requestHeaders: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const hasResults = data.tournaments.nodes.length > 0;

    if (hasResults) {
      // Write response to file
      const outputFile = `./data/fetched-data/page${pageNum}-response.json`;
      console.log(`outputFile: ${outputFile}`);
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`Response saved to ${outputFile}. Continuing to fetch data.`);

      fetchData(pageNum + 1, endPage);
    } else {
      console.log(`No results for page ${pageNum}`);
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
    if (error.response?.errors) {
      console.error('GraphQL errors:', error.response.errors);
    }
  }
}