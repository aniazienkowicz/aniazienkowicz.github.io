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

// Steuerung der Filter-Buttons & Infotexte
// Steuerung der Filter-Buttons & Infotexte
function setupFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const infoTextProd = document.getElementById('filter-infotext');
    const infoTextDev = document.getElementById('filter-infotext2');
    const infoTextTrans = document.getElementById('filter-infotext3');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // 1. "active"-Klasse umschalten
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // 2. Filter-Wert auslesen
            const selectedFilter = e.target.getAttribute('data-filter').trim();
            
            // 3. ULTRA-SMOOTH INFOTEXT STEUERUNG
            if (infoTextProd && infoTextDev && infoTextTrans) {
                // Erstmal alle Texte elegant ausblenden (Zustand weicht nach oben/unten aus)
                infoTextProd.className = 'info-text-hidden';
                infoTextDev.className = 'info-text-hidden';
                infoTextTrans.className = 'info-text-hidden';

                // Mit einer ultrakurzen Verzögerung den gewählten Text reinschweben lassen
                if (selectedFilter === 'Product Labeling') {
                    setTimeout(() => {
                        infoTextProd.className = 'info-text-visible';
                    }, 200);
                } else if (selectedFilter === 'Device Labeling') {
                    setTimeout(() => {
                        infoTextDev.className = 'info-text-visible';
                    }, 200);
                } else if (selectedFilter === 'Transport Labeling') {
                    setTimeout(() => {
                        infoTextTrans.className = 'info-text-visible';
                    }, 200);
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
}

// Katalog im HTML rendern
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

    // Hover-Effekte nach dem Rendern frisch anbinden
    attachHoverEffects(katalog);
}

// Ausgelagerte Hover-Effekte (wichtig, da die Karten bei jedem Filtern neu generiert werden!)
function attachHoverEffects(katalog) {
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');

        if (!img || !title || !author) return;

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

        // Event-Listener für Titel
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

        // Event-Listener für Autor
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