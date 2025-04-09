// Script to update tripoint data files with information from page4-response.json
// Only includes events with "Singles" in their name
import fs from 'fs';

// Read the page4 response data
try {
  const responseData = JSON.parse(fs.readFileSync('./page8-response.json', 'utf8'));
  const tournaments = responseData.tournaments.nodes;

  // ---- Update tripoint-tournaments.json ----
  let tournamentsData = {};
  try {
    // Try to read existing tournaments data
    tournamentsData = JSON.parse(fs.readFileSync('./tripoint-tournaments.json', 'utf8'));
  } catch (error) {
    console.log('No existing tournaments data found or invalid format, creating new file');
  }

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
  fs.writeFileSync('./tripoint-tournaments.json', JSON.stringify(tournamentsData, null, 2));
  console.log(`Successfully updated tripoint-tournaments.json with ${tournamentsAdded} tournaments from page 4`);

  // ---- Update tripoint-events.json ----
  let eventsData = {};
  try {
    // Try to read existing events data
    eventsData = JSON.parse(fs.readFileSync('./tripoint-events.json', 'utf8'));
  } catch (error) {
    console.log('No existing events data found or invalid format, creating new file');
  }

  // Add events data - only for events with "Singles" in the name
  let eventsAdded = 0;
  tournaments.forEach(tournament => {
    // Use tournament id as the key for organizing events
    if (tournament.id && tournament.events && tournament.events.length > 0) {
      // Create array for events if it doesn't exist
      if (!eventsData[tournament.id]) {
        eventsData[tournament.id] = [];
      }

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

          // Check if event already exists before adding
          const exists = eventsData[tournament.id].some(e => e.id === event.id);
          if (!exists) {
            eventsData[tournament.id] = eventObject;
            eventsAdded++;
          }
        }
      });

      // If no events were added for this tournament, remove the empty array
      if (eventsData[tournament.id].length === 0) {
        delete eventsData[tournament.id];
      }
    }
  });

  // Write the updated events data to the file
  fs.writeFileSync('./tripoint-events.json', JSON.stringify(eventsData, null, 2));
  console.log(`Successfully updated tripoint-events.json with ${eventsAdded} Singles events from page 4`);

  // ---- Update tripoint-standings.json ----
  let standingsData = {};
  try {
    // Try to read existing standings data
    standingsData = JSON.parse(fs.readFileSync('./tripoint-standings.json', 'utf8'));
  } catch (error) {
    console.log('No existing standings data found or invalid format, creating new file');
  }

  // Add standings data - only for events with "Singles" in the name
  let standingsEventsAdded = 0;
  tournaments.forEach(tournament => {
    tournament.events.forEach(event => {
      // Only process events that have "Singles" in their name and have standings data
      if (event.name.includes('Singles') &&
          event.standings &&
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
  fs.writeFileSync('./tripoint-standings.json', JSON.stringify(standingsData, null, 2));
  console.log(`Successfully updated tripoint-standings.json with ${standingsEventsAdded} Singles event standings from page 4`);

  console.log("All data files have been updated successfully!");

} catch (error) {
  console.error('Error processing data:', error);
}