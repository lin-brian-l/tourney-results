import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Function to read JSON files
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../tripoint-tournaments.json'));

    // Convert object to array and sort by startAt date (descending)
    const tournamentsArray = Object.values(tournaments || {}).sort((a, b) => b.startAt - a.startAt);

    res.render('tournaments', {
      tournaments: tournamentsArray,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading tournament data' });
  }
});

app.get('/tournament/:id', async (req, res) => {
  try {
    console.log('inside route!');
    const tournamentId = req.params.id;
    const tournaments = await readJsonFile(path.join(__dirname, '../tripoint-tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../tripoint-events.json'));

    const tournament = tournaments[tournamentId];
    const tournamentEvent = events[tournamentId] || {};

    if (!tournament) {
      return res.status(404).render('error', { error: 'Tournament not found' });
    }

    res.render('tournament-detail', {
      tournament,
      events: [tournamentEvent],
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading tournament details' });
  }
});

app.get('/event/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const standings = await readJsonFile(path.join(__dirname, '../tripoint-standings.json'));

    // Find the tournament that contains this event
    const tournaments = await readJsonFile(path.join(__dirname, '../tripoint-tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../tripoint-events.json'));

    // Find the event info
    let eventInfo = null;
    let tournamentInfo = null;

    // Search through all tournaments to find the event
    const event = Object.values(events).find(tournamentEvent => tournamentEvent.id.toString() === eventId);

    for (const [tournamentId, tournamentEvent] of Object.entries(events)) {
      if (tournamentEvent.id.toString() === eventId) {
        eventInfo = tournamentEvent;
        tournamentInfo = tournaments[tournamentId];
        break;
      }
    }

    const eventStandings = standings[eventId] || [];

    if (!eventInfo) {
      return res.status(404).render('error', { error: 'Event not found' });
    }

    res.render('event-detail', {
      event: eventInfo,
      tournament: tournamentInfo,
      standings: eventStandings,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    console.error('Error in /event/:id route:', error);
    res.status(500).render('error', { error: 'Error loading event details' });
  }
});

app.get('/all-events', async (req, res) => {
  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../tripoint-tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../tripoint-events.json'));
    const standings = await readJsonFile(path.join(__dirname, '../tripoint-standings.json'));

    // Create an array of all events with their tournament info
    const allEvents = [];

    for (const [tournamentId, event] of Object.entries(events)) {
      const tournament = tournaments[tournamentId];

      if (tournament) {
        allEvents.push({
          event,
          tournament,
          hasStandings: !!standings[event.id]
        });
      }
    }

    // Sort events by date (newest first)
    allEvents.sort((a, b) => b.event.startAt - a.event.startAt);

    res.render('all-events', {
      events: allEvents,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    console.error('Error in /all-events route:', error);
    res.status(500).render('error', { error: 'Error loading events data' });
  }
});

app.get('/rankings', async (req, res) => {
  try {
    const standings = await readJsonFile(path.join(__dirname, '../tripoint-standings.json'));
    
    // Create a map to track player placements
    const playerStats = {};
    
    // Process all standings data
    for (const [eventId, eventStandings] of Object.entries(standings)) {
      if (!Array.isArray(eventStandings)) continue;
      
      eventStandings.forEach(standing => {
        if (!standing.entrant || !standing.entrant.name) return;
        
        const playerName = standing.entrant.name;
        const placement = standing.placement;
        
        // Initialize player record if not exists
        if (!playerStats[playerName]) {
          playerStats[playerName] = {
            name: playerName,
            totalTop3: 0,
            first: 0,
            second: 0,
            third: 0
          };
        }
        
        // Count placements
        if (placement === 1) {
          playerStats[playerName].first++;
          playerStats[playerName].totalTop3++;
        } else if (placement === 2) {
          playerStats[playerName].second++;
          playerStats[playerName].totalTop3++;
        } else if (placement === 3) {
          playerStats[playerName].third++;
          playerStats[playerName].totalTop3++;
        }
      });
    }
    
    // Convert to array and sort by total top 3 placements, then by 1st, 2nd, 3rd
    const rankings = Object.values(playerStats).sort((a, b) => {
      if (b.totalTop3 !== a.totalTop3) return b.totalTop3 - a.totalTop3;
      if (b.first !== a.first) return b.first - a.first;
      if (b.second !== a.second) return b.second - a.second;
      return b.third - a.third;
    });
    
    res.render('rankings', {
      rankings
    });
  } catch (error) {
    console.error('Error in /rankings route:', error);
    res.status(500).render('error', { error: 'Error loading rankings data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});