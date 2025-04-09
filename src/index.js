import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { request, gql } from 'graphql-request';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const API_URL = 'https://api.start.gg/gql/alpha';

// Set API headers with the token from environment variables
const headers = {
  Authorization: `Bearer ${process.env.START_GG_API_KEY}`
};

// GraphQL query to get tournament info
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
        standings(query: { page: 1, perPage: 8 }) {
          nodes {
            placement
            entrant {
              name
              participants {
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
`;

async function getTournamentInfo(slug) {
  try {
    const data = await request(
      API_URL,
      tournamentQuery,
      { slug },
      headers
    );
    return data;
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { tournament: null, error: null });
});

app.post('/tournament', async (req, res) => {
  const { slug } = req.body;
  
  try {
    const data = await getTournamentInfo(slug);
    res.render('index', { tournament: data.tournament, error: null });
  } catch (error) {
    res.render('index', { 
      tournament: null, 
      error: 'Error fetching tournament data. Please check the slug and try again.'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
