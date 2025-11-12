// Script to update data files with information from the fetched_data directory
import fs from 'fs';

const relativePath = './data'
const fetchedDataPath = `${relativePath}/fetched_data`;
const tournamentsPath = `${relativePath}/tournaments.json`;
const eventsPath = `${relativePath}/singles-events.json`;
const standingsPath = `${relativePath}/singles-standings.json`;
const

try {
    const allFiles = fs.readdirSync(fetchedDataPath);
    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));

    jsonFiles.forEach(fileName => {
        const responseData = JSON.parse(fs.readFileSync(`${fetchedDataPath}/${fileName}`, 'utf8'));
        const tournaments = responseData.tournaments.nodes;

        updateTournamentsFile(fileName, tournaments);
        updateEventsFile(fileName, tournaments);
        updateStandingsFile(fileName, tournaments);
    });

    updatePlayersFile();
} catch (error) {
    console.log(error);
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
                slug: tournament.slug,
                startAt: tournament.startAt,
                endAt: tournament.endAt
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

    // Add events data - only for events with "Singles" in the name
    let eventsAdded = 0;
    tournaments.forEach(tournament => {
        // Use tournament id as the key for organizing events
        if (tournament.id && tournament.events && tournament.events.length > 0) {
            // Add each event from the tournament that contains "Singles" in the name
            tournament.events.forEach(event => {
                if (event.id && event.name.includes('Singles')) {
                    // Create a clean event object without the standings data
                    const eventObject = {
                        id: event.id,
                        name: event.name,
                        slug: event.slug,
                        startAt: event.startAt,
                        numEntrants: event.numEntrants,
                        state: event.state
                    };

                    eventsData[tournament.id] = eventObject;
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

    // Add standings data - only for events with "Singles" in the name
    let standingsEventsAdded = 0;
    tournaments.forEach(tournament => {
        tournament.events.forEach(event => {
            if (event.standings &&
                event.standings.nodes &&
                event.standings.nodes.length > 0) {

                // Use event id as the key
                standingsData[event.id] = event.standings.nodes;
                console.log(`Added standings for: ${event.name} (ID: ${event.id}) from tournament: ${tournament.name}`);
                standingsEventsAdded++;
            }
        });
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
}