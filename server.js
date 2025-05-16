const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

let currentVideoId = '';
let currentTitle = '';
let currentTime = 0;
let lyricsData = {};

// Charger les paroles existantes
const lyricsPath = path.join(__dirname, 'lyrics.json');
if (fs.existsSync(lyricsPath)) {
  lyricsData = JSON.parse(fs.readFileSync(lyricsPath));
}

// Mise à jour de la vidéo actuelle
app.post('/update-current-video', (req, res) => {
  currentVideoId = req.body.id || '';
  currentTitle = req.body.title || '';
  res.sendStatus(200);
});

// Obtenir les paroles
app.get('/lyrics', (req, res) => {
  res.send(lyricsData[currentVideoId] || '');
});

// Obtenir le titre de la vidéo
app.get('/video-title', (req, res) => {
  res.send(currentTitle || '');
});

// Sauvegarder des paroles
app.post('/save-lyrics', (req, res) => {
  const { id, lyrics } = req.body;
  if (!id || !lyrics) return res.status(400).send('ID ou paroles manquants');

  lyricsData[id] = lyrics;
  fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

const syncPath = path.join(__dirname, 'sync');

// Charger paroles synchronisées
app.get('/sync-data/:id', (req, res) => {
  const filePath = path.join(syncPath, req.params.id + '.json');
  if (!fs.existsSync(filePath)) return res.status(404).send('Pas trouvé');
  res.sendFile(filePath);
});

// Sauvegarder corrections
app.post('/save-sync-data', (req, res) => {
  const { id, syncData } = req.body;
  if (!id || !syncData) return res.status(400).send('ID ou données manquants');

  const filePath = path.join(syncPath, id + '.json');
  fs.writeFileSync(filePath, JSON.stringify(syncData, null, 2));
  res.sendStatus(200);
});

// Ajouter cette route pour gérer les paroles synchronisées
app.post('/save', (req, res) => {
  const { id, syncData } = req.body;

  if (!id || !syncData) {
    return res.status(400).send('ID ou données manquants');
  }

  const filename = `${id}.json`;
  const savePath = path.join(__dirname, 'paroles-sync', filename);

  fs.mkdirSync(path.join(__dirname, 'paroles-sync'), { recursive: true });

  fs.writeFileSync(savePath, JSON.stringify(syncData, null, 2));
  res.sendStatus(200);
});


app.get('/paroles-sync.json', (req, res) => {
  if (!currentVideoId) return res.status(404).send("Aucune vidéo en cours");

  const filePath = path.join(__dirname, 'paroles-sync', `${currentVideoId}.json`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Paroles synchronisées non trouvées.");
  }
});

app.get('/update-current-video', (req, res) => {
  res.json({ id: currentVideoId });
});

app.get('/current-video', (req, res) => {
  res.json({ id: currentVideoId, title: currentTitle });
});

// Met à jour le temps courant (envoyé par lecteur.html)
app.post('/update-current-time', (req, res) => {
  currentTime = req.body.time || 0;
  res.sendStatus(200);
});

// Récupère le temps courant (lu par afficheur.html)
app.get('/current-time', (req, res) => {
  res.json({ time: currentTime });
});

