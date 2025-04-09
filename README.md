# Tournament Results Viewer

A web application that displays tournament data from the start.gg API, showing tournaments, events, and player rankings.

## Features

- View all tournaments in a card-based layout
- Browse all events across tournaments in a table view
- View detailed information for each tournament and its events
- See event standings with player placements
- Player rankings showing who has the most top-3 placements

## Data Files

The application uses three main JSON data files:
- `tripoint-tournaments.json` - Contains tournament information
- `tripoint-events.json` - Contains event information for each tournament
- `tripoint-standings.json` - Contains player standings for each event

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your start.gg API key (needed for API scripts)
4. Run the application:
   ```
   npm start
   ```
5. For development with live reloading:
   ```
   npm run dev
   ```
6. Open your browser to `http://localhost:3000`

## Navigation

- **Tournaments** - View all tournaments
- **All Events** - Browse all events across tournaments
- **Player Rankings** - See player rankings based on top-3 placements

## Data Update Scripts

The repository includes several scripts for fetching and updating data:
- `update-standings.js` - Update standings data from API response
- `fetch-page4.js` - Fetch data from the start.gg API using the template query
- `update-data-page4.js` - Update all data files with events containing "Singles" in their name

## Technologies Used

- Express.js - Web framework
- EJS - Templating engine
- GraphQL - API query language for data fetching
- start.gg API - Tournament data source
- Nodemon - Development server with live reloading

## Resources

- [start.gg API Documentation](https://developer.start.gg/docs/intro/)
- [GraphQL Request](https://github.com/prisma-labs/graphql-request) - Simple GraphQL client
- [Express.js Documentation](https://expressjs.com/)
- [EJS Documentation](https://ejs.co/)