// Script to update tripoint-standings.json with data from page4-response.json
import fs from 'fs';

// Read the data files
try {
  const responseData = JSON.parse(fs.readFileSync('./page4-response.json', 'utf8'));
  let standingsData = {};
  
  try {
    // Try to read existing standings data
    standingsData = JSON.parse(fs.readFileSync('./tripoint-standings.json', 'utf8'));
  } catch (error) {
    console.log('No existing standings data found or invalid format, creating new file');
  }

  // Extract all singles events from the response
  const tournaments = responseData.tournaments.nodes;
  let eventsAdded = 0;
  
  tournaments.forEach(tournament => {
    tournament.events.forEach(event => {
      // Only process events that have "Singles" in their name and have standings data
      if (event.name.includes('Singles') && 
          event.standings && 
          event.standings.nodes && 
          event.standings.nodes.length > 0) {
        
        // Use event id as the key
        standingsData[event.id] = event.standings.nodes;
        console.log(`Added event: ${event.name} (ID: ${event.id}) from tournament: ${tournament.name}`);
        eventsAdded++;
      }
    });
  });

  // Write the updated standings data to the file
  fs.writeFileSync('./tripoint-standings.json', JSON.stringify(standingsData, null, 2));
  console.log(`Successfully updated tripoint-standings.json with ${eventsAdded} events from page 4`);
} catch (error) {
  console.error('Error processing data:', error);
}