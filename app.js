// Notities openen
openNotes.addEventListener('click', () => {
  notesApp.setAttribute('visible', true);
});

// Browser openen
openBrowser.addEventListener('click', () => {
  browserApp.setAttribute('visible', true);
});

// Spotify openen
openSpotify.addEventListener('click', () => {
  spotifyApp.setAttribute('visible', true);
});

// Sluiten
notesClose.addEventListener('click', () => notesApp.setAttribute('visible', false));
browserClose.addEventListener('click', () => browserApp.setAttribute('visible', false));
spotifyClose.addEventListener('click', () => spotifyApp.setAttribute('visible', false));
