import 'dotenv/config';
import { request, gql } from 'graphql-request';

const API_URL = 'https://api.start.gg/gql/alpha';

// You'll need to create a .env file with your API key
const headers = {
  Authorization: `Bearer ${process.env.START_GG_API_KEY}`
};

// Example query to get tournament info
const tournamentQuery = gql`
  query TournamentQuery($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      startAt
      endAt
      events {
        id
        name
        numEntrants
      }
    }
  }
`;

async function getTournamentInfo(slug) {
  try {
    const data = await request(
      API_URL,
      tournamentQuery,
      { slug },
      headers
    );
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching tournament data:', error);
  }
}

// Example usage: 
// Replace 'evo2023' with an actual tournament slug
getTournamentInfo('evo2023');