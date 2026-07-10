// main.js - GANZ OBEN ABÄNDERN:
import ColorThief from './color-thief.mjs'; // Lädt die lokale Datei aus dem gleichen Ordner

let allData = [];
const colorThief = new ColorThief(); 

console.log("[System] main.js erfolgreich geladen. Starte JSON-Fetch...");

// ... (Der gesamte Rest deiner main.js bleibt genau so, wie ich ihn dir im letzten Schritt gegeben habe!)

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
// 3. Katalog im HTML rendern
function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog || !Array.isArray(items)) return;

    let html = '';

    // HTML-String bauen (ohne das problematische crossorigin-Attribut)
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

    // 4. Farben über einen unsichtbaren CORS-Bypass extrahieren
    items.forEach((item, i) => {
        const card = document.getElementById(`card-${i}`);
        if (!card) return;

        const img = card.querySelector('.card-image img');
        if (!img) return;

        const setFallbackColor = () => {
            const fallbackFarben = ['255,87,34', '76,175,80', '233,30,99', '156,39,176', '0,188,212'];
            const zufallsFarbe = fallbackFarben[Math.floor(Math.random() * fallbackFarben.length)];
            card.style.setProperty('--hover-color-rgb', zufallsFarbe);
        };

        // Wir laden das Bild im Hintergrund als Blob, um CORS komplett auszuhebeln
        fetch(img.src)
            .then(response => {
                if (!response.ok) throw new Error();
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = function () {
                    // Erstellt ein unsichtbares Hilfs-Bild mit Base64-Daten
                    const tempImg = new Image();
                    tempImg.src = reader.result;
                    tempImg.onload = function () {
                        try {
                            const color = colorThief.getColor(tempImg);
                            if (color && !isNaN(color[0])) {
                                console.log(`[Erfolg] Card ${i}: Farbe ist rgb(${color.join(',')})`);
                                card.style.setProperty('--hover-color-rgb', `${color[0]}, ${color[1]}, ${color[2]}`);
                            } else {
                                setFallbackColor();
                            }
                        } catch (e) {
                            setFallbackColor();
                        }
                    };
                };
                reader.readAsDataURL(blob);
            })
            .catch(() => {
                // Falls selbst das lokale Fetch fehlschlägt, sofort Fallback nutzen
                setFallbackColor();
            });
    });
}