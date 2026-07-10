let allData = [];
const colorThief = new ColorThief(); 

console.log("[System] main.js erfolgreich geladen. Starte JSON-Fetch...");

// 2. JSON-Datei laden
fetch('/assets/data/katalog.json')
    .then(response => {
        if (!response.ok) throw new Error('JSON-Datei konnte nicht geladen werden');
        return response.json();
    })
    .then(data => {
        allData = data;
        console.log(`[System] JSON erfolgreich geladen. ${data.length} Einträge gefunden.`);
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

    // 4. Karten holen und Hover-Effekte hinzufügen
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card, i) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');

        if (!img) return;

        // Hilfsfunktion, um die Farbe sicher zu setzen
        function applyColor() {
            try {
                if (img.complete && img.naturalWidth > 0) {
                    let [r, g, b] = colorThief.getColor(img);
                    
                    // Helligkeit berechnen
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    
                    // Wenn zu hell, mathematisch abdunkeln
                    if (brightness > 130) {
                        const faktor = 0.4; // 0.4 dunkelt noch etwas stärker ab für bessere Lesbarkeit
                        r = Math.floor(r * faktor);
                        g = Math.floor(g * faktor);
                        b = Math.floor(b * faktor);
                    }

                    title.style.color = `rgb(${r}, ${g}, ${b})`;
                    author.style.color = `rgb(${r}, ${g}, ${b})`;
                }
            } catch (err) {
                // Fallback, falls CORS oder ColorThief blockiert
                title.style.color = '#222222'; 
                author.style.color = '#222222';
            }
        }

        // Event-Listener für Hover
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

        card.addEventListener('mouseleave', () => {
            title.style.color = '';  
            author.style.color = '';
        });
    });
}