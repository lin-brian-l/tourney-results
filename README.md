# Tournament Results App

A simple application that fetches tournament data from the start.gg API.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your start.gg API key
4. Run the application:
   ```
   node src/index.js
   ```

## Getting an API Key

1. Go to [start.gg developer settings](https://start.gg/admin/profile/developer)
2. Create a new application
3. Copy your API key to the `.env` file

## Resources

- [start.gg API Documentation](https://developer.start.gg/docs/intro/)
- [GraphQL Request](https://github.com/prisma-labs/graphql-request) - Simple GraphQL client used in this project