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
        renderKatalog(allData);
    })
    .catch(error => {
        console.error('--- KRITISCHER FEHLER BEIM LADEN ---', error);
        const katElem = document.getElementById('katalog');
        if (katElem) katElem.innerHTML = '<div class="loading">Fehler beim Laden der Daten</div>';
    });

// 3. Katalog im HTML rendern
function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog || !Array.isArray(items)) return;

    let html = '';

    // HTML-String bauen
    items.forEach((item, i) => {
        let authorText = item.Author === '-' ? 'Autor unbekannt' : item.Author;
        let authorClass = item.Author === '-' ? 'unknown' : '';

        html += `
            <div class="card" id="card-${i}">
                <div class="card-content">
                    <div class="card-title">${item.Titel}</div>
                    <div class="card-author ${authorClass}">${authorText}</div>
                    <div class="card-image">
                        <img src="${item['@image']}" alt="${item.Titel}">
                    </div>
                </div>
            </div>
        `;
    });

    katalog.innerHTML = html;

    // 4. Karten holen und Hover-Effekte mit Farberkennung hinzufügen
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');

        if (!img) return;

        // Hilfsfunktion, um die Farbe sicher zu setzen
        function applyColor() {
            try {
                if (img.complete && img.naturalWidth > 0) {
                    const [r, g, b] = colorThief.getColor(img);
                    title.style.color = `rgb(${r}, ${g}, ${b})`;
                    author.style.color = `rgb(${r}, ${g}, ${b})`;
                }
            } catch (err) {
                // FALLBACK: Wenn CORS blockiert (z.B. lokal ohne Server), nutzen wir Dunkelgrau
                console.warn("Farbextraktion blockiert/fehlgeschlagen. Nutze Fallback-Farbe.");
                title.style.color = '#444444'; 
                author.style.color = '#444444';
            }
        }

        // Sobald die Maus über die KARTE fährt
        card.addEventListener('mouseenter', () => {
            if (img.complete) {
                applyColor();
            } else {
                img.addEventListener('load', function onImgLoad() {
                    applyColor();
                    img.removeEventListener('load', onImgLoad);
                });
            }
        });

        // Sobald die Maus die Karte verlässt -> Farbe zurücksetzen
        card.addEventListener('mouseleave', () => {
            title.style.color = '';  
            author.style.color = '';
        });
    });
}