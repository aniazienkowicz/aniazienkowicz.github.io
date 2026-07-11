let allData = [];
const colorThief = new ColorThief(); 

console.log("[System] main.js erfolgreich geladen. Starte JSON-Fetch...");

// JSON-Datei laden
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

function setupFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const infoTextProd = document.getElementById('filter-infotext');
    const infoTextDev = document.getElementById('filter-infotext2');
    const infoTextTrans = document.getElementById('filter-infotext3'); // <-- Jetzt richtig verknüpft!
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // 1. "active"-Klasse umschalten
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // 2. Filter-Wert auslesen
            const selectedFilter = e.target.getAttribute('data-filter').trim();
            
            // 3. INFOTEXT STEUERUNG
            if (infoTextProd && infoTextDev && infoTextTrans) {
                // Erstmal alle auf versteckt setzen
                infoTextProd.className = 'info-text-hidden';
                infoTextDev.className = 'info-text-hidden';
                infoTextTrans.className = 'info-text-hidden';

                // Jetzt die sichtbare Klasse zuweisen
                if (selectedFilter === 'Product Labeling') {
                    infoTextProd.className = 'info-text-visible';
                } else if (selectedFilter === 'Device Labeling') {
                    infoTextDev.className = 'info-text-visible';
                } else if (selectedFilter === 'Transport Labeling') {
                    infoTextTrans.className = 'info-text-visible';
                }
            }
            
            // 4. Daten filtern
            if (selectedFilter === 'all') {
                renderKatalog(allData);
            } else {
                const filteredData = allData.filter(item => {
                    const itemCategory = item.Category || item.Kategorie;
                    return itemCategory && itemCategory.trim() === selectedFilter;
                });
                renderKatalog(filteredData);
            }
        });
    });
}// <-- Diese Klammer hatte gefehlt und den Absturz verursacht!

// Katalog im HTML rendern (mit getauschten Spalten 2 & 3)
function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog || !Array.isArray(items)) return;

    let html = '';

    if (items.length === 0) {
        katalog.innerHTML = '<div class="no-results">Keine Einträge für diesen Filter gefunden.</div>';
        return;
    }

    let letztesThema = ''; // Definiert außerhalb der Schleife

    items.forEach((item, i) => {
        let authorText = item.Author === '-' ? 'Autor unbekannt' : item.Author;
        let authorClass = item.Author === '-' ? 'unknown' : '';
        let infoText = item.Zusatztext ? item.Zusatztext : '-';
        const aktuellesThema = item.Thema || '';

        if (aktuellesThema !== letztesThema) {
            html += `
                <div class="thema-group-header">
                    <h2>${aktuellesThema}</h2>
                </div>
            `;
            letztesThema = aktuellesThema; // KORRIGIERT: Kein doppeltes "let" mehr!
        }

        // HIER GETAUSCHT: card-author steht jetzt VOR card-info
        html += `
            <div class="card" id="card-${i}">
                <div class="card-content">
                    <div class="card-title">${item.Titel}</div>
                    <div class="card-info">${infoText}</div>
                    <div class="card-author ${authorClass}">${authorText}</div>
                    <div class="card-image">
                        <img src="${item['@image']}" alt="${item.Titel}" crossorigin="anonymous">
                    </div>
                </div>
            </div>
        `;
    });

    katalog.innerHTML = html;
    attachHoverEffects(katalog);
}

// Ausgelagerte Hover-Effekte (Jetzt inklusive card-info!)
function attachHoverEffects(katalog) {
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');
        const info = card.querySelector('.card-info'); // <-- HIER ERGÄNZT

        if (!img || !title || !author || !info) return;

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

        // Hilfsfunktion, um Event-Listener ohne redundanten Code an ein Element zu binden
        function bindColorHover(element) {
            element.addEventListener('mouseenter', () => {
                if (img.complete) {
                    getTargetColor((color) => { element.style.color = color; });
                } else {
                    img.addEventListener('load', function onImgLoad() {
                        getTargetColor((color) => { element.style.color = color; });
                        img.removeEventListener('load', onImgLoad);
                    });
                }
            });
            element.addEventListener('mouseleave', () => { element.style.color = ''; });
        }

        // Hover anwenden auf alle drei Text-Spalten
        bindColorHover(title);
        bindColorHover(author);
        bindColorHover(info); // <-- Dadurch färbt sich jetzt auch der Zusatztext!
    });
}