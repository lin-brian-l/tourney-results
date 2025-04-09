# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- Install dependencies: `npm install`
- Run application: `npm start`
- There are no tests yet, but when added they'll use: `npm test`

## Project Structure
- ES modules syntax (`import`/`export`)
- GraphQL queries using `graphql-request` library
- Environment variables via `dotenv`
- The `./tripoint-tournaments.json` file contains a list of Tripoint tournaments where the key is the tournament's `id` and the value is the tournament data from the start.gg API.
- The `./tripoint-events.json` file contains a list of Tripoint events where the key is the `id` of the tournament where the event took place and the value is the event data from the start.gg API.
- The `./tripoint-standings.json` file contains a list of Tripoint event standings where the key is the `id` of the event and the value is the standings data from the start.gg API.


## Code Style Guidelines
- Reference the start.gg API documentation (https://developer.start.gg/docs/intro/)
- Use modern JavaScript with ES modules
- Indent with 2 spaces
- Use async/await for asynchronous code
- Handle errors with try/catch blocks
- Use template literals for string interpolation
- Use const for variables that don't change
- Prefer arrow functions for callbacks
- Name functions using camelCase
- Document functions with comments
- Log errors to console with details
- Use destructuring for objects and arrays