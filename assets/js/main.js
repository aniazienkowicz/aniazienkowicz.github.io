let allData = [];
let activeItems = [];
let currentLightboxIndex = -1;

console.log("[System] main.js erfolgreich geladen.");

// JSON-Datei laden
fetch('/assets/data/katalog.json')
    .then(response => {
        if (!response.ok) throw new Error('JSON-Datei konnte nicht geladen werden');
        return response.json();
    })
    .then(data => {
        allData = data;
        renderKatalog(sortData(allData, false));
        setupFilter();
        setupSymbolInfo();
        initLightbox();
        initBackToTop();
    })
    .catch(error => console.error('Fehler beim Laden:', error));

// Sortier-Logik
function sortData(dataArray, sortByCategory = true) {
    return [...dataArray].sort((a, b) => {
        const themeA = (a.Thema || '').trim().toLowerCase();
        const themeB = (b.Thema || '').trim().toLowerCase();
        const themeComp = themeA.localeCompare(themeB);

        if (sortByCategory) {
            const catA = (a.Category || a.Kategorie || '').trim().toLowerCase();
            const catB = (b.Category || b.Kategorie || '').trim().toLowerCase();
            const catComp = catA.localeCompare(catB);
            return catComp !== 0 ? catComp : themeComp;
        }
        return themeComp !== 0 ? themeComp : (a.Titel || '').trim().toLowerCase().localeCompare((b.Titel || '').trim().toLowerCase());
    });
}

// Filter-Logik
function setupFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const infoTextAll = document.getElementById('filter-infotextall');
    const infoTextProd = document.getElementById('filter-infotext');
    const infoTextDev = document.getElementById('filter-infotext2');
    const infoTextTrans = document.getElementById('filter-infotext3');
    const deviceSymbols = document.getElementById('device-symbols');
    const infoBox = document.getElementById('symbol-info-box');
    const safetyTitle = document.getElementById('safety-marks-title');

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            const selectedFilter = e.target.getAttribute('data-filter').trim();
            
            let filteredData = allData;
            let sortByCategory = true;

            // 1. Daten filtern
            if (selectedFilter !== 'all') {
                filteredData = allData.filter(item => {
                    const itemCat = (item.Category || item.Kategorie || '').trim();
                    return itemCat === selectedFilter;
                });
            } else {
                sortByCategory = false;
            }
            renderKatalog(sortData(filteredData, sortByCategory));

            // 2. Alle Infotexte verstecken
            [infoTextAll, infoTextProd, infoTextDev, infoTextTrans, deviceSymbols, safetyTitle].forEach(el => {
                if (el) el.className = 'info-text-hidden';
            });

            // 3. Infobox für Symbole zurücksetzen
            if (infoBox) {
                infoBox.classList.remove('visible');
                setTimeout(() => { infoBox.style.display = 'none'; }, 400);
            }
            
            document.querySelectorAll('#device-symbols img').forEach(i => {
                i.classList.remove('is-active');
                if (i.getAttribute('data-original')) i.src = i.getAttribute('data-original');
            });
            
            // 4. Den korrekten Infotext anzeigen
            if (selectedFilter === 'all') {
                if (infoTextAll) infoTextAll.className = 'info-text-visible';
            } else if (selectedFilter === 'Product Labeling') {
                if (infoTextProd) infoTextProd.className = 'info-text-visible';
            } else if (selectedFilter === 'Device Labeling') {
                if (infoTextDev) infoTextDev.className = 'info-text-visible';
                if (deviceSymbols) deviceSymbols.className = 'info-text-visible';
                if (safetyTitle) safetyTitle.className = 'info-text-visible';
            } else if (selectedFilter === 'Transport Labeling') {
                if (infoTextTrans) infoTextTrans.className = 'info-text-visible';
            }
        });
    });
}

// Symbol-Infobox-Logik
function setupSymbolInfo() {
    const ds = document.getElementById('device-symbols');
    if (!ds) return;

    let safetyTitle = document.getElementById('safety-marks-title');
    if (!safetyTitle) {
        safetyTitle = document.createElement('h2');
        safetyTitle.id = 'safety-marks-title';
        safetyTitle.textContent = 'Safety Marks';
        safetyTitle.className = 'info-text-hidden'; 
        ds.parentNode.insertBefore(safetyTitle, ds);
    }

    let infoBox = document.getElementById('symbol-info-box');
    if (!infoBox) {
        infoBox = document.createElement('div');
        infoBox.id = 'symbol-info-box';
        ds.parentNode.insertBefore(infoBox, ds.nextSibling);
    }
    const symbolData = {
        "BSMI": "The BSMI mark (Bureau of Standards, Metrology and Inspection) indicates products that comply with the applicable requirements of Taiwan regarding safety, electromagnetic compatibility (EMC), and environmental protection.By applying this mark, the manufacturer declares that the product complies with the relevant Taiwanese directives and legal requirements, and may be placed on the market within Taiwan. The BSMI mark is mandatory for numerous electronic and electrical product groups.",
        "CE": "The CE mark (Conformité Européenne) indicates products that comply with the applicable requirements of the European Union regarding safety, health protection, and environmental protection. By applying this mark, the manufacturer declares that the product complies with the relevant EU directives and legal requirements, and may be placed on the market within the European Economic Area. The CE mark is mandatory for numerous product groups.",
        "CMIM": "The CMIM mark (Maroc Conformité) indicates products that comply with the applicable requirements of the Kingdom of Morocco regarding safety, electromagnetic compatibility (EMC), and health protection. By applying this mark, the manufacturer declares that the product complies with the relevant Moroccan directives and legal requirements, and may be placed on the market within Morocco. The CMIM mark is mandatory for numerous electronic and electrical product groups. ",
        "CSA": "The CSA mark (Canadian Standards Association) indicates products that comply with the applicable requirements of Canada and the United States regarding safety, performance, and health protection. By applying this mark, the manufacturer declares that the product has been successfully tested by an accredited testing body, complies with the relevant North American standards and legal requirements, and may be placed on the market within Canada and the US. The CSA mark is mandatory for numerous electronic and electrical product groups.",
        "C-Tick": "The C-Tick mark indicated products that complied with the applicable requirements of Australia and New Zealand regarding electromagnetic compatibility (EMC) and radio frequency interference. By applying this mark, the manufacturer declared that the product complied with the relevant regulatory requirements of the Australian ACMA (Australian Communications and Media Authority) and could be placed on the market within Australia and New Zealand. The C-Tick mark was mandatory for numerous electronic and electrical product groups before it was fully superseded by the RCM mark.",
        "cURus": "The cURus mark (Underwriters Laboratories Recognized Component Mark for Canada and the United States) indicates components and parts that comply with North American safety requirements. The name is broken down into c (complies with Canadian standards), UR (the reversed UL logo for Recognized Component), and us (complies with US standards). It confirms that the component has been tested by UL and is approved for safe installation into electrical end products in North America. This mark is mandatory for many internal components, such as power supplies or circuit boards, to enable the subsequent certification of the entire device.",
        "KC": "The KC mark (Korea Certification) indicates products that comply with the applicable requirements of South Korea regarding safety, electromagnetic compatibility (EMC), and health protection. By applying this mark, the manufacturer declares that the product complies with the relevant South Korean directives and legal requirements, and may be placed on the market within South Korea. The KC mark is mandatory for numerous electronic and electrical product groups.",
        "MIC": "The MIC mark (Ministry of Internal Affairs and Communications) indicates products that comply with the applicable requirements of Japan regarding radio technologies, telecommunications, and electromagnetic compatibility (EMC). By applying this mark, the manufacturer declares that the product complies with the relevant Japanese radio and telecommunications laws and may be placed on the market within Japan. The MIC mark is mandatory for numerous wireless and electronic product groups (such as Wi-Fi, Bluetooth, or cellular devices).",
        "NCC": "The NCC mark (National Communications Commission) indicates products that comply with the applicable requirements of Taiwan regarding radio technologies, telecommunications, and electromagnetic compatibility (EMC). By applying this mark, the manufacturer declares that the product complies with the relevant Taiwanese telecommunications and radio laws and may be placed on the market within Taiwan. The NCC mark is mandatory for numerous wireless product groups (such as Wi-Fi, Bluetooth, or cellular devices).",
        "RCM": "The RCM mark (Regulatory Compliance Mark) indicates products that comply with the applicable requirements of Australia and New Zealand regarding electrical safety, electromagnetic compatibility (EMC), and radio technologies. By applying this mark, the manufacturer declares that the product complies with the relevant regulatory requirements of the Australian ACMA and New Zealand authorities and may be placed on the market within Australia and New Zealand. The RCM mark is mandatory for numerous electronic and electrical product groups. ",
        "China RoHS": "The China RoHS mark (Restriction of Hazardous Substances) indicates products that comply with the applicable requirements of the People’s Republic of China regarding the restriction and declaration of hazardous substances in electrical and electronic equipment. The black symbol containing the number “20” declares that the product contains certain hazardous materials, which can be safely used for an Environment-Friendly Use Period of 20 years. By applying this mark, the manufacturer declares that the product complies with the relevant Chinese regulations and may be placed on the market within the People’s Republic of China.",
        "TÜV": "The TÜV Type Approved mark (Technical Inspection Association Type Approved Mark) indicates components and parts that have been tested by an independent TÜV testing body for safety, quality, and compliance with applicable standards. It confirms that the design of the component meets technical safety requirements and that the ongoing production is regularly monitored to ensure consistent quality. This mark simplifies the subsequent certification of the entire end product in which the component is installed.",
        "WEEE": "The WEEE mark, represented by the crossed-out wheeled bin, is used to identify electrical and electronic equipment that must not be disposed of with household waste. It indicates that the product is subject to the requirements of the European Waste Electrical and Electronic Equipment (WEEE) Directive and must be collected separately for recycling and recovery. The symbol helps ensure environmentally responsible disposal and the proper treatment of valuable materials contained in the product."
    };

    document.querySelectorAll('#device-symbols img').forEach(icon => {
        const alt = icon.getAttribute('alt');
        icon.setAttribute('data-original', icon.src);

        if (symbolData[alt]) {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => {
                const isActive = icon.classList.contains('is-active');

                if (isActive) {
                    icon.src = icon.getAttribute('data-original');
                    infoBox.classList.remove('visible');
                    icon.classList.remove('is-active');
                    setTimeout(() => { if (!infoBox.classList.contains('visible')) infoBox.style.display = 'none'; }, 400);
                } else {
                    document.querySelectorAll('#device-symbols img').forEach(i => {
                        i.classList.remove('is-active');
                        i.src = i.getAttribute('data-original');
                    });

                    if (alt === 'BSMI') {
                        icon.src = 'assets/img/BSMI2.png';
                    }
                    if (alt === 'CE') {
                        icon.src = 'assets/img/CE2.png';
                    }
                    if (alt === 'CMIM') {
                        icon.src = 'assets/img/CMIM2.png';
                    }
                    if (alt === 'CSA') {
                        icon.src = 'assets/img/CSA2.png';
                    }
                    if (alt === 'C-Tick') {
                        icon.src = 'assets/img/C_Tick2.png';
                    }
                    if (alt === 'cURus') {
                        icon.src = 'assets/img/curus2.png';
                    }
                    if (alt === 'KC') {
                        icon.src = 'assets/img/kc2.png';
                    }
                    if (alt === 'MIC') {
                        icon.src = 'assets/img/mic2.png';
                    }
                    if (alt === 'NCC') {
                        icon.src = 'assets/img/ncc2.png';
                    }
                    if (alt === 'RCM') {
                        icon.src = 'assets/img/rcm2.png';
                    }
                    if (alt === 'China RoHS') {
                        icon.src = 'assets/img/china_rohs2.png';
                    }
                    if (alt === 'TÜV') {
                        icon.src = 'assets/img/tuev2.png';
                    }
                    if (alt === 'WEEE') {
                        icon.src = 'assets/img/weee2.png';
                    }


                    infoBox.innerHTML = `<p>${symbolData[alt]}</p>`;
                    infoBox.style.display = 'block';
                    setTimeout(() => infoBox.classList.add('visible'), 10);
                    icon.classList.add('is-active');
                }
            });
        }
    });
}

function renderKatalog(items) {
    const katalog = document.getElementById('katalog');
    if (!katalog) return;
    activeItems = items;
    katalog.innerHTML = items.length === 0 ? '<div class="no-results">Keine Einträge.</div>' : '';
    
    let html = '';
    let letztesThema = '';
    items.forEach((item, i) => {
        if (item.Thema !== letztesThema) {
            html += `<div class="thema-group-header"><h2>${item.Thema}</h2></div>`;
            letztesThema = item.Thema;
        }
        html += `<div class="card" id="card-${i}"><div class="card-content"><div class="card-title">${item.Titel}</div><div class="card-info">${item.Zusatztext || '-'}</div><div class="card-author">${item.Author || '-'}</div><div class="card-image"><img src="${item['@image']}" alt="${item.Titel}"></div></div></div>`;
    });
    katalog.innerHTML = html;
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const katalog = document.getElementById('katalog');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const closeBtn = document.querySelector('.close-btn');

    // Funktion zum Aktualisieren des Bildes
    const showImage = (index) => {
        if (index >= 0 && index < activeItems.length) {
            currentLightboxIndex = index;
            lightboxImg.src = activeItems[currentLightboxIndex]['@image'];
        }
    };

    // Öffnen der Lightbox beim Klick auf ein Bild
    katalog.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card) {
            currentLightboxIndex = parseInt(card.id.replace('card-', ''), 10);
            showImage(currentLightboxIndex);
            lightbox.style.display = 'flex';
        }
    });

    // Schließen
    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    // Navigation: Zurück
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Verhindert, dass das Lightbox-Klick-Event ausgelöst wird
        let newIndex = currentLightboxIndex - 1;
        if (newIndex < 0) newIndex = activeItems.length - 1; // Endlosschleife
        showImage(newIndex);
    });

    // Navigation: Vor
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let newIndex = currentLightboxIndex + 1;
        if (newIndex >= activeItems.length) newIndex = 0; // Endlosschleife
        showImage(newIndex);
    });

    // Optional: Schließen bei Klick auf den Hintergrund
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });
}

    document.querySelector('.close-btn').addEventListener('click', () => lightbox.style.display = 'none');

function initBackToTop() {
    const topBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            topBtn.style.display = 'block';
        } else {
            topBtn.style.display = 'none';
        }
    });
    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}