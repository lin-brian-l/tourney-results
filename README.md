# Tournament Results App

A web application that allows users to search for tournament results from the start.gg API by entering a tournament slug.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your start.gg API key
4. Run the application:
   ```
   npm start
   ```
5. Open your browser to `http://localhost:3000`

## How to Use

1. Enter a tournament slug in the search box (e.g., `evo2023`)
2. Click "Get Results" to view tournament information and event standings

## Getting an API Key

1. Go to [start.gg developer settings](https://start.gg/admin/profile/developer)
2. Create a new application
3. Copy your API key to the `.env` file

## Finding Tournament Slugs

Tournament slugs are part of the URL on start.gg. For example:
- For tournament at `https://start.gg/tournament/evo-2023`, the slug is `evo-2023`

## Technologies Used

- Express.js - Web framework
- EJS - Templating engine
- GraphQL - API query language
- start.gg API - Tournament data source

## Resources

- [start.gg API Documentation](https://developer.start.gg/docs/intro/)
- [GraphQL Request](https://github.com/prisma-labs/graphql-request) - Simple GraphQL client
- [Express.js Documentation](https://expressjs.com/)