/**
 * Script to aggregate data files with information from the fetched-data directory. This should be run from the root of this application (`/tourney-results`).
 * This script assumes that file names in /fetched-data are in the format `page{pageNum}-response.json`.
 * It also appends new data to the end of the respective files and does not create new files on every execution.
 *
 * Usage: node data/scripts/aggregate-fetched-data.js --startPage=<number> --endPage=<number>
 *
 * --startPage: The starting page number of the files to aggregate. Defaults to 1.
 * --endPage: The ending page number of the files to aggregate, stopping once the page number exceeds this limit.
 *
 * Example: node data/scripts/aggregate-fetched-data.js
 * Example: node data/scripts/aggregate-fetched-data.js --startPage=48
 */
import fs from 'fs';
import { getArg } from './helpers.js';

const startggLink = 'https://start.gg/';

const relativePath = './data';
const fetchedDataPath = `${relativePath}/fetched-data`;
const tournamentsPath = `${relativePath}/tournaments.json`;
const eventsPath = `${relativePath}/singles-events.json`;
const standingsPath = `${relativePath}/singles-standings.json`;
const standingsOverridePath = `${relativePath}/standings-to-players-override.json`;
const playersPath = `${relativePath}/players.json`;

const startPage = getArg('startPage', 1);
if (startPage < 1) {
    throw new Error('Start page must be greater than 0.');
}

const endPage = getArg('endPage', NaN);
if (endPage && startPage > endPage) {
  throw new Error(`Start page (${startPage}) is greater than end page (${endPage})`);
}

try {
    const jsonFiles = getJsonFileNames();

    const startingIndex = startPage - 1;
    const endingIndex = endPage ? Math.min(endPage, jsonFiles.length) : jsonFiles.length;

    for (let i = startingIndex; i < endingIndex; i++) {
        const fileName = jsonFiles[i];
        const responseData = JSON.parse(fs.readFileSync(`${fetchedDataPath}/${fileName}`, 'utf8'));
        const tournaments = responseData.tournaments.nodes;

        updateTournamentsFile(fileName, tournaments);
        updateEventsFile(fileName, tournaments);
        updateStandingsAndPlayersFiles(fileName, tournaments);
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
            tournamentsData[tournament.id] = {
                id: tournament.id,
                name: tournament.name,
                url: startggLink + tournament.slug,
                start_at: tournament.startAt,
                end_at: tournament.endAt,
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
                if (isExcludedEvent(event)) return;

                // Create a clean event object without the standings data
                eventsData[event.id] = {
                    id: event.id,
                    name: event.name,
                    url: startggLink + event.slug,
                    start_at: event.startAt,
                    num_entrants: event.numEntrants,
                    tournament_id: tournament.id,
                };

                eventsAdded++;
            });
        }
    });

    // Write the updated events data to the file
    fs.writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2));
    console.log(`Successfully updated ${eventsPath} with ${eventsAdded} Singles events from ${fileName}`);
}

function updateStandingsAndPlayersFiles(fileName, tournaments) {
    const standingsData = getExistingOrFreshFileData(standingsPath);
    const playersData = getExistingOrFreshFileData(playersPath);
    const standingsOverride = getExistingOrFreshFileData(standingsOverridePath);

    let playersAdded = 0;
    let playersUpdated = 0;
    let standingsEventsAdded = 0;
    tournaments.forEach(tournament => {
        if (tournament.events && tournament.events.length > 0) {
            tournament.events.forEach(event => {
                if (!isExcludedEvent(event) &&
                    event.standings &&
                    event.standings.nodes &&
                    event.standings.nodes.length > 0) {

                    event.standings.nodes.forEach(standing => {
                        let playerId = standing.entrant?.participants[0]?.user?.id || null;
                        if (!playerId && standingsOverride[standing.id]) {
                            playerId = standingsOverride[standing.id].player_id;
                        }

                        // Use standings id as the key
                        standingsData[standing.id] = {
                            id: standing.id,
                            tournament_id: tournament.id,
                            event_id: event.id,
                            player_id: playerId,
                            placement: standing.placement,
                        };

                        if (playerId) {
                            if (!playersData[playerId]) {
                                playersData[playerId] = {
                                    id: playerId,
                                    name: standing.entrant?.participants[0]?.user.player?.gamerTag || null,
                                    standings: [standing.id],
                                };

                                playersAdded++;
                            } else if (!playersData[playerId].standings.includes(standing.id)) {
                                playersData[playerId].standings.push(standing.id);

                                playersUpdated++;
                            }
                        }
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

    // Write the players data to the file
    fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
    console.log(`Added ${playersAdded} new players and updated ${playersUpdated} players`);
}

function isExcludedEvent(event) {
    const excludedEventIds = [
        1238506, // Community Day 10/18/24, 3.02 event
        1238507, // Community Day 10/18/24, 3.6 event
        1092057, // Super TPS III, 3.6 event
        1092058, // Super TPS III, 3.02 event
    ];

    return excludedEventIds.includes(event.id) || isSideEvent(event.name);
}

function isSideEvent(eventName) {
    const sideEventNames = [
        'random',
        'amateur',
        'bonus',
        'dorito',
        'side bracket',
        'side event',
        'character bans',
        'lethal league',
        'ban 5',
        'all-stars',
    ];
    const sideEventRegex = new RegExp(sideEventNames.join('|'), 'i');

    return sideEventRegex.test(eventName);
}

function getExistingOrFreshFileData(filePath) {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    console.log(`No existing data for ${filePath}. A new file will be created.`);

    return {};
}
