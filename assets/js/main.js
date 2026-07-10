let allData = [];
// Da Color Thief über das HTML geladen wird, greifen wir direkt auf das globale Objekt zu
const colorThief = new ColorThief(); 

console.log("[System] main.js erfolgreich geladen. Starte JSON-Fetch...");

// 2. JSON-Datei laden (mit absolutem Pfad)
fetch('/assets/data/katalog.json')
    .then(response => {
        if (!response.ok) throw new Error('JSON-Datei konnte nicht geladen werden (404/500)');
        return response.json();
    })
    .then(data => {
        allData = data;
        console.log(`[System] JSON erfolgreich geladen. ${data.length} Einträge gefunden. Starte Rendering...`);
        
        // Initial alle Einträge anzeigen
        renderKatalog(allData);
        // Filter-Logik aktivieren
        setupFilter();
    })
    .catch(error => {
        console.error('--- KRITISCHER FEHLER BEIM LADEN ---', error);
        const katElem = document.getElementById('katalog');
        if (katElem) katElem.innerHTML = '<div class="loading">Fehler beim Laden der Daten</div>';
    });

// NEU: Funktion zur Steuerung der Filter-Buttons
function setupFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // 1. "active"-Klasse bei allen Buttons entfernen und beim geklickten hinzufügen
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // 2. Ausgewählten Filter-Wert auslesen
            const selectedFilter = e.target.getAttribute('data-filter');
            
            // 3. Daten filtern
            if (selectedFilter === 'all') {
                renderKatalog(allData); // Zeige alles
            } else {
                const filteredData = allData.filter(item => {
                    // Falls dein JSON-Feld anders heißt (z.B. item.Kategorie), hier anpassen!
                    return item.Category === selectedFilter || item.Kategorie === selectedFilter;
                });
                renderKatalog(filteredData); // Zeige nur Treffer
            }
        });
    });
}

// 3. Katalog im HTML rendern (Bleibt gleich, baut aber bei jedem Filter die Karten neu)
function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog || !Array.isArray(items)) return;

    let html = '';

    if (items.length === 0) {
        katalog.innerHTML = '<div class="no-results">Keine Einträge für diesen Filter gefunden.</div>';
        return;
    }

    items.forEach((item, i) => {
        let authorText = item.Author === '-' ? 'Autor unbekannt' : item.Author;
        let authorClass = item.Author === '-' ? 'unknown' : '';

        html += `
            <div class="card" id="card-${i}">
                <div class="card-content">
                    <div class="card-title">${item.Titel}</div>
                    <div class="card-author ${authorClass}">${authorText}</div>
                    <div class="card-image">
                        <img src="${item['@image']}" alt="${item.Titel}" crossorigin="anonymous">
                    </div>
                </div>
            </div>
        `;
    });

    katalog.innerHTML = html;

    // 4. Karten holen und Hover-Effekte mit Farberkennung hinzufügen (Abschnitt unverändert)
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');

        if (!img) return;

        function getTargetColor(callback) {
            try {
                if (img.complete && img.naturalWidth > 0) {
                    const palette = colorThief.getPalette(img, 8);
                    let chosenColor = null;
                    
                    for (let i = 0; i < palette.length; i++) {
                        const [r, g, b] = palette[i];
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        if (brightness < 220) {
                            chosenColor = [r, g, b];
                            break;
                        }
                    }
                    
                    if (!chosenColor) chosenColor = palette[0]; 
                    
                    let [r, g, b] = chosenColor;
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    if (brightness > 130) {
                        const faktor = 0.5;
                        r = Math.floor(r * faktor);
                        g = Math.floor(g * faktor);
                        b = Math.floor(b * faktor);
                    }

                    callback(`rgb(${r}, ${g}, ${b})`);
                }
            } catch (err) {
                console.warn("Farbextraktion fehlgeschlagen. Nutze Fallback.");
                callback('#444444');
            }
        }

        title.addEventListener('mouseenter', () => {
            if (img.complete) {
                getTargetColor((color) => { title.style.color = color; });
            } else {
                img.addEventListener('load', function onImgLoad() {
                    getTargetColor((color) => { title.style.color = color; });
                    img.removeEventListener('load', onImgLoad);
                });
            }
        });
        title.addEventListener('mouseleave', () => { title.style.color = ''; });

        author.addEventListener('mouseenter', () => {
            if (img.complete) {
                getTargetColor((color) => { author.style.color = color; });
            } else {
                img.addEventListener('load', function onImgLoad() {
                    getTargetColor((color) => { author.style.color = color; });
                    img.removeEventListener('load', onImgLoad);
                });
            }
        });
        author.addEventListener('mouseleave', () => { author.style.color = ''; });
    });
}