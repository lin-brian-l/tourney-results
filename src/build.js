import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared basePath variable
let currentBasePath = '';

// Import the app setup from index.js
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Set basePath in res.locals for templates (references currentBasePath variable)
app.use((req, res, next) => {
  res.locals.basePath = currentBasePath;
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

// Routes (copied from index.js)
app.get('/', async (req, res) => {
  try {
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
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
    const tournamentId = req.params.id;
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));
    const events = await readJsonFile(path.join(__dirname, '../data/singles-events.json'));
    const tournament = tournaments[tournamentId];
    const tournamentEvents = tournament.events.map(eventId => events[eventId]);

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
    const standings = await readJsonFile(path.join(__dirname, '../data/singles-standings.json'));

    const allEvents = [];
    Object.values(tournaments).forEach(tournament => {
      tournament.events.forEach(eventId => {
        allEvents.push({
          event: events[eventId],
          tournament,
          hasStandings: !!standings[eventId],
        });
      });
    });

    allEvents.sort((a, b) => b.event.start_at - a.event.start_at);

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

// Build function to generate static files
async function build() {
  const outputDir = path.join(__dirname, '../docs');
  // Set base path for GitHub Pages deployment
  const basePath = process.env.BASE_PATH || '/tourney-results';

  console.log('Starting static site build...');
  console.log(`Using base path: ${basePath}`);

  // Update the shared basePath variable
  currentBasePath = basePath;

  // Clean output directory
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, that's fine
  }
  await fs.mkdir(outputDir, { recursive: true });

  // Create .nojekyll file to prevent GitHub Pages from processing with Jekyll
  await fs.writeFile(path.join(outputDir, '.nojekyll'), '');
  console.log('✓ Created .nojekyll file');

  // Helper function to fetch and save a route
  const saveRoute = async (route, filename) => {
    return new Promise((resolve, reject) => {
      const server = app.listen(0, async () => {
        try {
          const port = server.address().port;
          const response = await fetch(`http://localhost:${port}${route}`);
          const html = await response.text();

          const filePath = path.join(outputDir, filename);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, html);

          console.log(`✓ Generated ${filename}`);
          server.close(() => resolve());
        } catch (error) {
          server.close(() => reject(error));
        }
      });
    });
  };

  try {
    // Generate home page
    await saveRoute('/', 'index.html');

    // Generate all-events page
    await saveRoute('/all-events', 'all-events.html');

    // Generate rankings page
    await saveRoute('/rankings', 'rankings.html');

    // Get tournament and event data to generate all detail pages
    const tournaments = await readJsonFile(path.join(__dirname, '../data/tournaments.json'));

    // Generate tournament detail pages
    for (const tournamentId of Object.keys(tournaments)) {
      await saveRoute(`/tournament/${tournamentId}`, `tournament/${tournamentId}.html`);
    }

    // Generate event detail pages
    for (const [tournamentId, tournament] of Object.entries(tournaments)) {
      for (const eventId of tournament.events) {
        await saveRoute(
          `/tournament/${tournamentId}/event/${eventId}`,
          `tournament/${tournamentId}/event/${eventId}.html`
        );
      }
    }

    // Copy public directory
    const publicDir = path.join(__dirname, '../public');
    const publicOutputDir = path.join(outputDir);

    async function copyDir(src, dest) {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyDir(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    }

    await copyDir(publicDir, publicOutputDir);
    console.log('✓ Copied public assets');

    console.log('\n✅ Build complete! Static files generated in ./docs');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();
