/**
 * ===================================
 * MAIN.JS - Contrôleur principal (VERSION COMPLÈTE)
 * ===================================
 *
 * Systèmes intégrés :
 * - Carte et ressources
 * - Villages et territoires
 * - Bâtiments et infrastructures
 * - Culture et recherche étendue
 * - Journal d'événements
 */

class Simulation {
    constructor() {
        // Récupérer le canvas
        this.canvas = document.getElementById('mainCanvas');

        // Créer la carte avec continents réalistes
        this.map = new Map(this.canvas, 4);

        // NOUVEAU : Système de caméra avec zoom et drag
        this.camera = new Camera(this.canvas, this.map);

        // NOUVEAU : Système de ressources mondial
        this.resourceMap = new ResourceMap(this.map);

        // NOUVEAU : Gestionnaire de bâtiments et infrastructures
        this.buildingManager = new BuildingManager();

        // NOUVEAU : Gestionnaire de villages
        this.villageManager = new VillageManager();

        // Système de culture étendu (8 âges, 45 technologies)
        this.culture = new Culture();

        // Journal d'événements
        this.eventLog = new EventLog();

        // Créer le gestionnaire d'entités
        this.entityManager = new EntityManager(this.map);
        this.entityManager.initialize();

        // NOUVEAU : Panels UI
        this.inspector = new HumanInspector(this.camera);
        this.techTreeUI = new TechTreeUI(this.culture);
        this.villagesPanel = new VillagesPanel(this.villageManager, this.camera);

        // État de la simulation
        this.isRunning = false;
        this.currentYear = 0;
        this.speed = 1;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // 30 FPS

        // Options d'affichage
        this.showTerritories = true;
        this.showResources = true;
        this.showRoads = true;

        // Récupérer les éléments du DOM
        this.elements = {
            yearDisplay: document.getElementById('yearDisplay'),
            speedDisplay: document.getElementById('speedDisplay'),
            populationDisplay: document.getElementById('populationDisplay'),
            researchDisplay: document.getElementById('researchDisplay'),
            researchProgress: document.getElementById('researchProgress'),
            mainPlayBtn: document.getElementById('mainPlayBtn'),
            mainPlayIcon: document.getElementById('mainPlayIcon'),
            mainPlayText: document.getElementById('mainPlayText'),
            speed1Btn: document.getElementById('speed1Btn'),
            speed2Btn: document.getElementById('speed2Btn'),
            speed4Btn: document.getElementById('speed4Btn')
        };

        // Initialiser le livre d'aide
        this.helpBook = new HelpBook();

        // Initialiser les contrôles
        this.initControls();

        // Mettre à jour l'affichage initial
        this.updateUI();

        // Logger l'initialisation
        this.eventLog.logEvent('Le monde a été créé', 'info');

        // Démarrer la boucle de rendu (tourne toujours, même en pause)
        this.startRenderLoop();
    }

    initControls() {
        // Grand bouton principal Play/Pause
        this.elements.mainPlayBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Boutons de vitesse
        this.elements.speed1Btn.addEventListener('click', () => {
            this.setSpeed(1);
        });

        this.elements.speed2Btn.addEventListener('click', () => {
            this.setSpeed(2);
        });

        this.elements.speed4Btn.addEventListener('click', () => {
            this.setSpeed(4);
        });

        // NOUVEAU : Détection du survol des humains pour l'inspector
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.inspector && this.entityManager.humans) {
                const hoveredHuman = this.inspector.detectHover(e, this.entityManager.humans);
                if (hoveredHuman) {
                    this.inspector.inspectHuman(hoveredHuman, this.villageManager);
                } else if (!this.inspector.selectedHuman) {
                    this.inspector.showEmpty();
                }
            }
        });
    }

    togglePlayPause() {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            this.elements.mainPlayIcon.textContent = '⏸';
            this.elements.mainPlayText.textContent = 'En cours...';
            this.elements.mainPlayBtn.classList.add('playing');
            this.lastFrameTime = performance.now();
        } else {
            this.elements.mainPlayIcon.textContent = '▶';
            this.elements.mainPlayText.textContent = 'Evolution Simulator';
            this.elements.mainPlayBtn.classList.remove('playing');
        }
    }

    setSpeed(speed) {
        this.speed = speed;
        this.updateSpeedButtons();
        this.updateUI();
    }

    updateSpeedButtons() {
        this.elements.speed1Btn.classList.remove('active');
        this.elements.speed2Btn.classList.remove('active');
        this.elements.speed4Btn.classList.remove('active');

        if (this.speed === 1) {
            this.elements.speed1Btn.classList.add('active');
        } else if (this.speed === 2) {
            this.elements.speed2Btn.classList.add('active');
        } else if (this.speed === 4) {
            this.elements.speed4Btn.classList.add('active');
        }
    }

    start() {
        // Démarrer la boucle de rendu (qui tourne toujours, même en pause)
        this.startRenderLoop();
    }

    startRenderLoop() {
        requestAnimationFrame((timestamp) => this.renderLoop(timestamp));
    }

    renderLoop(timestamp) {
        const deltaTime = timestamp - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = timestamp;

            // Mettre à jour UNIQUEMENT si la simulation est en cours
            if (this.isRunning) {
                this.update();
            }

            // Rendre TOUJOURS (même en pause) pour voir le zoom/drag
            this.render();
        }

        requestAnimationFrame((ts) => this.renderLoop(ts));
    }

    loop(timestamp) {
        // Méthode deprecated, gardée pour compatibilité
        this.renderLoop(timestamp);
    }

    update() {
        // Incrémenter l'année
        const yearIncrement = this.speed * 0.5;
        this.currentYear += yearIncrement;

        // Mettre à jour l'event log avec l'année actuelle
        this.eventLog.setCurrentYear(this.currentYear);

        // Mettre à jour la carte
        this.map.update();

        // NOUVEAU : Mettre à jour les ressources (régénération naturelle)
        this.resourceMap.update(this.culture);

        // Tracker la recherche actuelle pour détecter les changements
        const previousResearch = this.culture.currentResearchId;

        // Mettre à jour les entités (avec culture, event log ET vitesse de simulation)
        this.entityManager.update(this.culture, this.eventLog, this.currentYear, this.speed);

        // NOUVEAU : Mettre à jour les bâtiments
        this.buildingManager.update(this.culture, this.eventLog);

        // NOUVEAU : Détecter et former des villages automatiquement
        const houses = this.entityManager.houses;
        const humans = this.entityManager.humans;

        if (houses.length >= 3 && Math.floor(this.currentYear) % 10 === 0) {
            const newVillages = this.villageManager.detectAndFormVillages(
                humans,
                houses,
                this.map,
                Math.floor(this.currentYear)
            );

            newVillages.forEach(village => {
                this.eventLog.logEvent(`🏘️ Nouveau village fondé : ${village.name}`, 'milestone');
            });
        }

        // NOUVEAU : Mettre à jour les villages
        this.villageManager.update(this.culture, this.map);

        // Détecter si une nouvelle recherche a commencé
        if (this.culture.currentResearchId !== previousResearch && this.culture.currentResearchId) {
            const tech = this.culture.getCurrentResearch();
            if (tech) {
                this.eventLog.logResearch(tech.name);
            }
        }

        // Détecter changement d'âge
        if (this.culture.currentAge > (this.lastAge || 1)) {
            this.eventLog.logEvent(`🎉 Nouvel âge atteint : Âge ${this.culture.currentAge}`, 'milestone');
            this.lastAge = this.culture.currentAge;
        }

        // NOUVEAU : Mettre à jour les panels UI (tech tree, villages)
        if (this.techTreeUI) {
            this.techTreeUI.update();
        }
        if (this.villagesPanel) {
            this.villagesPanel.update();
        }

        // Mettre à jour l'UI
        this.updateUI();
    }

    render() {
        // Effacer le canvas (fond noir)
        this.map.ctx.fillStyle = '#000000';
        this.map.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Appliquer la transformation de la caméra pour TOUT le rendu du monde
        this.camera.applyTransform(this.map.ctx);

        // Dessiner la carte avec la transformation caméra
        this.drawMapTiles();

        // NOUVEAU : Dessiner l'overlay des ressources (mines, forêts, rivières)
        if (this.showResources) {
            this.resourceMap.drawOverlay(this.map.ctx, this.map.tileSize);
        }

        // NOUVEAU : Dessiner les territoires des villages
        if (this.showTerritories) {
            this.villageManager.draw(this.map.ctx, this.map.tileSize, true, true);
        }

        // NOUVEAU : Dessiner les routes et bâtiments
        if (this.showRoads) {
            this.buildingManager.draw(this.map.ctx, this.map.tileSize);
        }

        // Dessiner toutes les entités (arbres, rochers, maisons, humains)
        this.entityManager.draw(this.map.ctx, this.map.tileSize);

        // Restaurer le contexte après le rendu du monde
        this.camera.restoreTransform(this.map.ctx);
    }

    /**
     * Dessine les tuiles de la carte (appelé avec transform caméra)
     */
    drawMapTiles() {
        const ctx = this.map.ctx;
        const tileSize = this.map.tileSize;

        // Dessiner uniquement les tuiles visibles pour optimiser
        const startX = Math.max(0, Math.floor(this.camera.x / tileSize) - 1);
        const startY = Math.max(0, Math.floor(this.camera.y / tileSize) - 1);
        const endX = Math.min(this.map.width, Math.ceil((this.camera.x + this.canvas.width / this.camera.zoom) / tileSize) + 1);
        const endY = Math.min(this.map.height, Math.ceil((this.camera.y + this.canvas.height / this.camera.zoom) / tileSize) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const terrainType = this.map.grid[y][x];
                let color = this.map.TERRAIN_COLORS[terrainType];

                // Légère variation de couleur basée sur la heightmap
                const height = this.map.heightMap[y][x];
                const variation = (height % 0.15) - 0.075;

                if (color && color.startsWith('#')) {
                    const r = parseInt(color.substr(1, 2), 16);
                    const g = parseInt(color.substr(3, 2), 16);
                    const b = parseInt(color.substr(5, 2), 16);

                    const newR = Math.max(0, Math.min(255, r + variation * 50));
                    const newG = Math.max(0, Math.min(255, g + variation * 50));
                    const newB = Math.max(0, Math.min(255, b + variation * 50));

                    color = `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }

    updateUI() {
        // Afficher l'année
        this.elements.yearDisplay.textContent = Math.floor(this.currentYear).toLocaleString('fr-FR');

        // Afficher la vitesse
        this.elements.speedDisplay.textContent = `x${this.speed}`;

        // Afficher la population
        if (this.elements.populationDisplay) {
            this.elements.populationDisplay.textContent = this.entityManager.getPopulation();
        }

        // Afficher la recherche actuelle
        if (this.elements.researchDisplay) {
            const currentResearch = this.culture.getCurrentResearch();
            if (currentResearch) {
                // Afficher avec l'icône et l'âge
                this.elements.researchDisplay.textContent = `${currentResearch.icon || ''} ${currentResearch.name} (Âge ${currentResearch.age})`;

                // Mettre à jour la barre de progression
                if (this.elements.researchProgress) {
                    const progress = this.culture.getResearchProgress();
                    this.elements.researchProgress.style.width = `${progress * 100}%`;
                }
            } else {
                this.elements.researchDisplay.textContent = '✨ Toutes les technologies débloquées !';
                if (this.elements.researchProgress) {
                    this.elements.researchProgress.style.width = '100%';
                }
            }
        }
    }
}

// ===================================
// INITIALISATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const simulation = new Simulation();

    console.log('🌍 Evolution Simulator initialisé !');
    console.log('📊 Carte générée :', simulation.map.width, 'x', simulation.map.height, 'tuiles');
    console.log('🔬 Système de culture activé');
    console.log('📜 Journal d\'événements activé');
    console.log('🎮 Cliquez sur le bouton principal pour démarrer');
});
