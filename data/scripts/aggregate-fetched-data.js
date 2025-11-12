/**
 * Script to aggregate data files with information from the fetched-data directory. This should be run from the root of this application (`/tourney-results`).
 * This script assumes that file names in /fetched-data are in the format `page{pageNum}-response.json`.
 * It also appends new data to the end of the respective files and does not create new files on every execution.
 *
 * Usage: node data/scripts/aggregate-fetched-data.js --startPage=<number> --endPage=<number> --shouldNotUpdatePlayers
 *
 * --startPage: The starting page number of the files to aggregate. Defaults to 1.
 * --endPage: The ending page number of the files to aggregate, stopping once the page number exceeds this limit.
 * --shouldNotUpdatePlayers: Whether to skip updating the players.json file with the data in singles-standings.json. Adding this argument sets the value to `true`.
 *
 * Example: node data/scripts/aggregate-fetched-data.js
 * Example: node data/scripts/aggregate-fetched-data.js --startPage=48
 * Example: node data/scripts/aggregate-fetched-data.js --startPage=2 --endPage=5 --shouldNotUpdatePlayers
 */
import fs from 'fs';
import { getArg } from './helpers.js';

const startggLink = 'https://start.gg/';

const relativePath = './data';
const fetchedDataPath = `${relativePath}/fetched-data`;
const tournamentsPath = `${relativePath}/tournaments.json`;
const eventsPath = `${relativePath}/singles-events.json`;
const standingsPath = `${relativePath}/singles-standings.json`;
const playersPath = `${relativePath}/players.json`;

const startPage = getArg('startPage', 1);
if (startPage < 1) {
    throw new Error('Start page must be greater than 0.');
}

const endPage = getArg('endPage', NaN);
if (endPage && startPage > endPage) {
  throw new Error(`Start page (${startPage}) is greater than end page (${endPage})`);
}

const shouldUpdatePlayers = !getArg('shouldNotUpdatePlayers', false);

try {
    // const jsonFiles = getJsonFileNames();

    // const startingIndex = startPage - 1;
    // const endingIndex = endPage ? Math.min(endPage, jsonFiles.length) : jsonFiles.length;

    // for (let i = startingIndex; i < endingIndex; i++) {
    //     const fileName = jsonFiles[i];
    //     const responseData = JSON.parse(fs.readFileSync(`${fetchedDataPath}/${fileName}`, 'utf8'));
    //     const tournaments = responseData.tournaments.nodes;

    //     updateTournamentsFile(fileName, tournaments);
    //     updateEventsFile(fileName, tournaments);
    //     updateStandingsFile(fileName, tournaments);
    // }

    if (shouldUpdatePlayers) {
        updatePlayersFile();
    }
} catch (error) {
    console.log(error);
}

function getJsonFileNames() {
    const allFiles = fs.readdirSync(fetchedDataPath);

    return allFiles
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
            // Extract page numbers from filenames like "page1-response.json"
            const pageNumA = parseInt(a.match(/page(\d+)/)?.[1] || 0);
            const pageNumB = parseInt(b.match(/page(\d+)/)?.[1] || 0);
            return pageNumA - pageNumB;
        });
}

function updateTournamentsFile(fileName, tournaments) {
    const tournamentsData = getExistingOrFreshFileData(tournamentsPath);

    // Add tournament data
    let tournamentsAdded = 0;
    tournaments.forEach(tournament => {
        // Use tournament id as the key
        if (tournament.id) {
            const eventIds = tournament.events ? tournament.events.map(event => event.id) : [];

            tournamentsData[tournament.id] = {
                id: tournament.id,
                name: tournament.name,
                url: startggLink + tournament.slug,
                startAt: tournament.startAt,
                endAt: tournament.endAt,
                events: eventIds,
            };

            tournamentsAdded++;
        }
    });

    // Write the updated tournaments data to the file
    fs.writeFileSync(tournamentsPath, JSON.stringify(tournamentsData, null, 2));
    console.log(`Successfully updated ${tournamentsPath} with ${tournamentsAdded} tournaments from ${fileName}`);
}

function updateEventsFile(fileName, tournaments) {
    const eventsData = getExistingOrFreshFileData(eventsPath);

    let eventsAdded = 0;
    tournaments.forEach(tournament => {
        if (tournament.events && tournament.events.length > 0) {
            tournament.events.forEach(event => {
                if (event.id) {
                    // Create a clean event object without the standings data
                    eventsData[event.id] = {
                        id: event.id,
                        name: event.name,
                        url: startggLink + event.slug,
                        startAt: event.startAt,
                        numEntrants: event.numEntrants,
                        tournament_id: tournament.id,
                    };

                    eventsAdded++;
                }
            });
        }
    });

    // Write the updated events data to the file
    fs.writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2));
    console.log(`Successfully updated ${eventsPath} with ${eventsAdded} Singles events from ${fileName}`);
}

function updateStandingsFile(fileName, tournaments) {
    const standingsData = getExistingOrFreshFileData(standingsPath);

    let standingsEventsAdded = 0;
    tournaments.forEach(tournament => {
        if (tournament.events && tournament.events.length > 0) {
            tournament.events.forEach(event => {
                if (event.standings &&
                    event.standings.nodes &&
                    event.standings.nodes.length > 0) {

                    event.standings.nodes.forEach(standing => {
                        // Use standings id as the key
                        standingsData[standing.id] = {
                            ...standing,
                            tournament_id: tournament.id,
                            event_id: event.id,
                        };
                    })

                    standingsEventsAdded++;
                    console.log(`Added standings for: ${event.name} (ID: ${event.id}) from tournament: ${tournament.name}`);
                }
            });
        }
    });

    // Write the updated standings data to the file
    fs.writeFileSync(standingsPath, JSON.stringify(standingsData, null, 2));
    console.log(`Successfully updated ${standingsPath} with ${standingsEventsAdded} Singles event standings from ${fileName}`);
}

function getExistingOrFreshFileData(filePath) {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    console.log(`No existing data for ${filePath}. A new file will be created.`);

    return {};
}

function updatePlayersFile() {
    const standingsData = getExistingOrFreshFileData(standingsPath);
    const playersData = getExistingOrFreshFileData(playersPath);

    let playersAdded = 0;
    Object.values(standingsData).forEach(standing => {
        const user = getValidUser(standing);
        if (!user) return;

        if (!playersData[user.id]) {
            playersData[user.id] = {
                id: user.id,
                name: user.player.gamerTag,
                standings: [],
            };
            playersAdded++;
        }

        // Add standing to player's standings
        playersData[user.id].standings.push(standing.id);
    })

    if (playersAdded > 0) {
        // Write the players data to the file
        fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
        console.log(`Successfully updated ${playersPath} with ${playersAdded} new players`);
    } else {
        console.log('No new players to add');
    }
}

function getValidUser(standing) {
    if (!standing.entrant?.participants?.length) {
        return undefined;
    }

    const participant = standing.entrant.participants[0];

    if (!participant.user || !participant.user.player) {
        return undefined;
    }

    return participant.user.id && participant.user.player.gamerTag ? participant.user : undefined;
}
