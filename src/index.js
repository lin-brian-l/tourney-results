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

// Set basePath for templates (empty for local development)
app.use((req, res, next) => {
  res.locals.basePath = '';
  next();
});

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
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));

    // Convert object to array and sort by start_at date (descending)
    const tournamentsArray = Object.values(tournaments || {}).sort((a, b) => b.start_at - a.start_at);

    res.render('tournaments', {
      basePath: res.locals.basePath,
      tournaments: tournamentsArray,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading tournament data', basePath: res.locals.basePath });
  }
});

app.get('/tournament/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../data/singles-events.json'));
    const tournament = tournaments[tournamentId];
    const tournamentEvents = Object.values(events).filter(event => event.tournament_id === tournamentId);

    if (!tournament) {
      return res.status(404).render('error', { error: 'Tournament not found', basePath: res.locals.basePath });
    }

    res.render('tournament-detail', {
      basePath: res.locals.basePath,
      tournament,
      events: tournamentEvents,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading tournament details', basePath: res.locals.basePath });
  }
});

app.get('/tournament/:tournamentId/event/:eventId', async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const eventId = parseInt(req.params.eventId);

  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../data/singles-events.json'));
    const standings = await readJsonFile(path.join(__dirname, '../data/singles-standings.json'));
    const players = await readJsonFile(path.join(__dirname, '../data/players.json'));

    const tournament = tournaments[tournamentId];
    const event = events[eventId];

    const eventStandings = Object.values(standings)
      .filter(standing => standing.event_id === eventId)
      .map(standing => ({
        ...standing,
        name: players[standing.player_id]?.name || null,
      }))
      .sort((standingA, standingB) => standingA.placement - standingB.placement);

    if (!event) {
      return res.status(404).render('error', { error: 'Event not found', basePath: res.locals.basePath });
    }

    res.render('event-detail', {
      basePath: res.locals.basePath,
      event,
      tournament,
      standings: eventStandings,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    console.error(`Error in /tournament/${tournamentId}/event/${eventId} route:`, error);
    res.status(500).render('error', { error: 'Error loading event details', basePath: res.locals.basePath });
  }
});

app.get('/all-events', async (req, res) => {
  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../data/singles-events.json'));

    // Create an array of all events with their tournament info
    const allEvents = [];

    Object.values(events).forEach(event => {
      const tournament = tournaments[event.tournament_id];

      allEvents.push({
        ...event,
        tournament,
      });
    })

    // Sort events by date (newest first)
    allEvents.sort((a, b) => b.start_at - a.start_at);

    res.render('all-events', {
      basePath: res.locals.basePath,
      events: allEvents,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    console.error('Error in /all-events route:', error);
    res.status(500).render('error', { error: 'Error loading events data', basePath: res.locals.basePath });
  }
});

app.get('/rankings', async (req, res) => {
  try {
    const players = await readJsonFile(path.join(__dirname, '../data/players.json'));
    const standings = await readJsonFile(path.join(__dirname, '../data/singles-standings.json'));

    // Create a map to track player placements
    const playerStats = {};

    // Process all standings data
    Object.values(players).forEach(player => {
      if (!player.name) return;

      const excludedPlayerIds = new Set([9767, 12373, 1861, 38899]);
      const playerId = player.id;
      if (excludedPlayerIds.has(playerId)) return;

      player.standings.forEach(standingId => {
        const placement = standings[standingId].placement;

        // Initialize player record if not exists
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            id: player.id,
            name: player.name,
            totalTop3: 0,
            first: 0,
            second: 0,
            third: 0
          };
        }

        // Count placements
        if (placement === 1) {
          playerStats[playerId].first++;
          playerStats[playerId].totalTop3++;
        } else if (placement === 2) {
          playerStats[playerId].second++;
          playerStats[playerId].totalTop3++;
        } else if (placement === 3) {
          playerStats[playerId].third++;
          playerStats[playerId].totalTop3++;
        }
      });
    });

    // Convert to array and sort by total top 3 placements, then by 1st, 2nd, 3rd
    const rankings = Object.values(playerStats).sort((a, b) => {
      if (b.totalTop3 !== a.totalTop3) return b.totalTop3 - a.totalTop3;
      if (b.first !== a.first) return b.first - a.first;
      if (b.second !== a.second) return b.second - a.second;
      return b.third - a.third;
    });

    res.render('rankings', {
      basePath: res.locals.basePath,
      rankings
    });
  } catch (error) {
    console.error('Error in /rankings route:', error);
    res.status(500).render('error', { error: 'Error loading rankings data', basePath: res.locals.basePath });
  }
});

app.get('/players/:id', async (req, res) => {
  const playerId = req.params.id;

  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../data/singles-events.json'));
    const standings = await readJsonFile(path.join(__dirname, '../data/singles-standings.json'));
    const players = await readJsonFile(path.join(__dirname, '../data/players.json'));

    const player = players[playerId];

    const playerStandings = {
      totalTop3: 0,
      first: 0,
      second: 0,
      third: 0,
    };

    const eventStandings = player.standings.map(standingId => {
      const standing = standings[standingId];
      const event = events[standing.event_id];

      let placementStr;

      switch (standing.placement) {
        case 1:
          placementStr = '1st';
          playerStandings.first++;
          playerStandings.totalTop3++;
          break;
        case 2:
          placementStr = '2nd';
          playerStandings.second++;
          playerStandings.totalTop3++;
          break;
        case 3:
          placementStr = '3rd';
          playerStandings.third++;
          playerStandings.totalTop3++;
          break;
        default:
          placementStr = `${standing.placement}th`;
          break;
      }

      event.tournament = tournaments[event.tournament_id];

      return {
        ...standing,
        placementStr,
        event
      }
    }).sort((eventStandingA, eventStandingB) => {
      return eventStandingB.event.start_at - eventStandingA.event.start_at;
    });

    res.render('player-detail', {
      basePath: res.locals.basePath,
      player,
      eventStandings,
      playerStandings,
      formatDate: (timestamp) => new Date(timestamp * 1000).toLocaleDateString()
    });
  } catch (error) {
    console.error('Error in /players/:id route:', error);
    res.status(500).render('error', { error: 'Error loading player data', basePath: res.locals.basePath })
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});