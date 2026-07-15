let allData = [];
let activeItems = []; // Speichert die aktuell sichtbaren (gefilterten) Einträge für die Lightbox-Navigation
let currentLightboxIndex = -1; // Aktueller Index in der Großansicht

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
        console.log(`[System] JSON erfolgreich geladen. ${data.length} Einträge gefunden. Starte Sortierung...`);
        
        // Initial für die "all"-Ansicht sortieren (sortByCategory = false)
        const sortedData = sortData(allData, false);
        
        renderKatalog(sortedData);
        setupFilter();
        initLightbox();
    })
    .catch(error => {
        console.error('--- KRITISCHER FEHLER BEIM LADEN ---', error);
        const katElem = document.getElementById('katalog');
        if (katElem) katElem.innerHTML = '<div class="loading">Fehler beim Laden der Daten</div>';
    });

// Upgrade: Sortiert flexibel je nach Filter-Zustand
function sortData(dataArray, sortByCategory = true) {
    return [...dataArray].sort((a, b) => {
        // Thema ist immer das primäre Sortierkriterium
        const themeA = (a.Thema || '').trim().toLowerCase();
        const themeB = (b.Thema || '').trim().toLowerCase();
        const themeComp = themeA.localeCompare(themeB);

        if (sortByCategory) {
            // 1. Sortierung für spezifische Filter (z. B. "Product Labeling"):
            // Erst nach Kategorie, dann nach Thema
            const catA = (a.Category || a.Kategorie || '').trim().toLowerCase();
            const catB = (b.Category || b.Kategorie || '').trim().toLowerCase();
            const catComp = catA.localeCompare(catB);
            
            if (catComp !== 0) return catComp;
            return themeComp;
        } else {
            // 2. Sortierung für "all" (Deine neue Logik):
            // Erst nach Thema, und bei gleichem Thema nach dem Anfangsbuchstaben des Titels
            if (themeComp !== 0) return themeComp;

            const titleA = (a.Titel || '').trim().toLowerCase();
            const titleB = (b.Titel || '').trim().toLowerCase();
            return titleA.localeCompare(titleB);
        }
    });
}

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
            
            // 3. INFOTEXT STEUERUNG
            if (infoTextProd && infoTextDev && infoTextTrans) {
                infoTextProd.className = 'info-text-hidden';
                infoTextDev.className = 'info-text-hidden';
                infoTextTrans.className = 'info-text-hidden';

                if (selectedFilter === 'Product Labeling') {
                    infoTextProd.className = 'info-text-visible';
                } else if (selectedFilter === 'Device Labeling') {
                    infoTextDev.className = 'info-text-visible';
                } else if (selectedFilter === 'Transport Labeling') {
                    infoTextTrans.className = 'info-text-visible';
                }
            }
            
            // 4. Daten filtern & sortieren
            if (selectedFilter === 'all') {
                // Für "all": Sortierung nach Thema -> Anfangsbuchstabe (sortByCategory = false)
                const sortedData = sortData(allData, false);
                renderKatalog(sortedData);
            } else {
                const filteredData = allData.filter(item => {
                    const itemCategory = item.Category || item.Kategorie;
                    return itemCategory && itemCategory.trim() === selectedFilter;
                });
                // Für spezifische Kategorien: Sortierung nach Kategorie -> Thema (sortByCategory = true)
                const sortedFilteredData = sortData(filteredData, true);
                renderKatalog(sortedFilteredData);
            }
        });
    });
}

// Katalog im HTML rendern
function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog || !Array.isArray(items)) return;

    // Speichert die aktuell im Grid gerenderten Elemente für die Lightbox-Navigation
    activeItems = items; 

    let html = '';

    if (items.length === 0) {
        katalog.innerHTML = '<div class="no-results">Keine Einträge für diesen Filter gefunden.</div>';
        return;
    }

    let letztesThema = '';

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
            letztesThema = aktuellesThema;
        }

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

// Hover-Effekte für Text-Spalten
function attachHoverEffects(katalog) {
    const cards = katalog.querySelectorAll('.card');
    cards.forEach((card) => {
        const img = card.querySelector('.card-image img');
        const title = card.querySelector('.card-title');
        const author = card.querySelector('.card-author');
        const info = card.querySelector('.card-info');

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

        bindColorHover(title);
        bindColorHover(author);
        bindColorHover(info);
    });
}

// NEU: Lightbox Logik-Steuerung
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!lightbox || !lightboxImg) return;

    // Bild in der Lightbox laden
    function showImage(index) {
        if (index < 0 || index >= activeItems.length) return;
        currentLightboxIndex = index;
        const item = activeItems[index];
        lightboxImg.src = item['@image'];
        lightboxImg.alt = item.Titel;
    }

    // Event Delegation: Öffnet die Lightbox beim Klick auf ein Bild im Grid
    const katalog = document.getElementById('katalog');
    if (katalog) {
        katalog.addEventListener('click', (e) => {
            const clickedImg = e.target.closest('.card-image img');
            if (clickedImg) {
                const card = clickedImg.closest('.card');
                if (card) {
                    // ID zerlegen (z.B. "card-4" -> Index 4)
                    const index = parseInt(card.id.replace('card-', ''), 10);
                    lightbox.style.display = 'flex';
                    showImage(index);
                }
            }
        });
    }

    // Schließen Event
    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    // Schließen beim Klick außerhalb des Bildes
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });

    // Weiter blättern (Endlos-Schleife)
    nextBtn.addEventListener('click', () => {
        if (activeItems.length === 0) return;
        const nextIndex = (currentLightboxIndex + 1) % activeItems.length;
        showImage(nextIndex);
    });

    // Zurück blättern (Endlos-Schleife)
    prevBtn.addEventListener('click', () => {
        if (activeItems.length === 0) return;
        const prevIndex = (currentLightboxIndex - 1 + activeItems.length) % activeItems.length;
        showImage(prevIndex);
    });

    // Tastatur-Support (Pfeiltasten & ESC)
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'ArrowRight') {
                const nextIndex = (currentLightboxIndex + 1) % activeItems.length;
                showImage(nextIndex);
            } else if (e.key === 'ArrowLeft') {
                const prevIndex = (currentLightboxIndex - 1 + activeItems.length) % activeItems.length;
                showImage(prevIndex);
            } else if (e.key === 'Escape') {
                lightbox.style.display = 'none';
            }
        }
    });
}