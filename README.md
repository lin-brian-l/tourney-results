# Tournament Results Viewer

An Express web application that displays tournament data from the start.gg API, specifically tracking Tripoint Project+ and Project M Singles tournament results.

## Features

- View all tournaments in a card-based layout
- Browse all events across tournaments in a table view
- View detailed information for each tournament and its events
- See event standings with player placements
- Player rankings showing who has the most top-3 placements

## Data Files

The application uses four main JSON data files located in the `data/` directory:
- `tournaments.json` - Contains tournament information
- `singles-events.json` - Contains Singles event information for each tournament
- `singles-standings.json` - Contains player standings for each event
- `players.json` - Contains player information aggregated from standings

## Project Structure

```
tourney-results/
├── data/                      # Data storage
│   ├── fetched-data/         # Raw API responses (page{N}-response.json)
│   ├── scripts/              # Data fetching and processing scripts
│   │   ├── fetch-data.js     # Fetches data from start.gg API
│   │   ├── aggregate-fetched-data.js  # Processes and aggregates data
│   │   ├── helpers.js        # Helper functions for scripts
│   │   └── template-query.md # GraphQL query template
│   ├── tournaments.json      # Processed tournament data
│   ├── singles-events.json   # Processed Singles event data
│   ├── singles-standings.json # Processed standings data
│   └── players.json          # Aggregated player data
├── public/
│   └── css/
│       └── style.css         # Application styles
├── src/
│   └── index.js              # Express server and routes
├── views/                    # EJS templates
│   ├── tournaments.ejs       # Main tournaments page
│   ├── tournament-detail.ejs # Individual tournament details
│   ├── event-detail.ejs      # Individual event details
│   ├── all-events.ejs        # All events listing
│   ├── rankings.ejs          # Player rankings page
│   └── error.ejs             # Error page
├── .env.example              # Environment variables template
├── CLAUDE.md                 # Project instructions for Claude Code
├── package.json              # Node.js dependencies and scripts
└── README.md                 # This file
```

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

## Application Routes

- `/` - Main tournaments page (card-based layout)
- `/tournament/:id` - Individual tournament details with its events
- `/tournament/:tournamentId/event/:eventId` - Individual event details with standings
- `/all-events` - Browse all events across all tournaments (table view)
- `/rankings` - Player rankings based on top-3 placements

## Data Update Scripts

The repository includes scripts in the `data/scripts/` directory for fetching and updating data:

### fetch-data.js
Fetches tournament data from the start.gg API in a paginated fashion.

Usage: `node data/scripts/fetch-data.js [options]`

Options:
- `--perPage=<number>` - Tournaments per page (default: 4)
- `--startPage=<number>` - Starting page number (default: 1)
- `--endPage=<number>` - Ending page number (optional)

Example: `node data/scripts/fetch-data.js --startPage=1 --endPage=10`

Fetched data is saved in `data/fetched-data/` as `page{N}-response.json` files.

### aggregate-fetched-data.js
Processes raw API responses and updates the main data files.

Usage: `node data/scripts/aggregate-fetched-data.js [options]`

Options:
- `--startPage=<number>` - Starting page number to process (default: 1)
- `--endPage=<number>` - Ending page number to process (optional)
- `--shouldNotUpdatePlayers` - Skip updating players.json file

Example: `node data/scripts/aggregate-fetched-data.js --startPage=1 --endPage=78`

This script reads files from `data/fetched-data/` and updates:
- `data/tournaments.json`
- `data/singles-events.json`
- `data/singles-standings.json`
- `data/players.json` (unless `--shouldNotUpdatePlayers` is specified)

### template-query.md
Contains a reference GraphQL query template for the start.gg API.

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