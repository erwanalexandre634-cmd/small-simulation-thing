/**
 * ===================================
 * MAIN.JS - Contrôleur principal (VERSION AMÉLIORÉE)
 * ===================================
 *
 * Ajouts :
 * - Système de culture et recherche
 * - Journal d'événements
 * - Intégration complète
 */

class Simulation {
    constructor() {
        // Récupérer le canvas
        this.canvas = document.getElementById('mainCanvas');

        // Créer la carte avec continents réalistes
        this.map = new Map(this.canvas, 4);

        // NOUVEAU : Créer le système de culture
        this.culture = new Culture();

        // NOUVEAU : Créer le journal d'événements
        this.eventLog = new EventLog();

        // Créer le gestionnaire d'entités
        this.entityManager = new EntityManager(this.map);
        this.entityManager.initialize();

        // État de la simulation
        this.isRunning = false;
        this.currentYear = 0;
        this.speed = 1;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // 30 FPS

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

        // Effectuer le rendu initial
        this.render();

        // Logger l'initialisation
        this.eventLog.logEvent('Le monde a été créé', 'info');
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
    }

    togglePlayPause() {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            this.elements.mainPlayIcon.textContent = '⏸';
            this.elements.mainPlayText.textContent = 'En cours...';
            this.elements.mainPlayBtn.classList.add('playing');
            this.lastFrameTime = performance.now();
            this.start();
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
        if (this.isRunning) {
            requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = timestamp;

            this.update();
            this.render();
        }

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update() {
        // Incrémenter l'année
        const yearIncrement = this.speed * 0.5;
        this.currentYear += yearIncrement;

        // Mettre à jour l'event log avec l'année actuelle
        this.eventLog.setCurrentYear(this.currentYear);

        // Mettre à jour la carte
        this.map.update();

        // Tracker la recherche actuelle pour détecter les changements
        const previousResearch = this.culture.currentResearchId;

        // Mettre à jour les entités (avec culture et event log)
        this.entityManager.update(this.culture, this.eventLog, this.currentYear);

        // Détecter si une nouvelle recherche a commencé
        if (this.culture.currentResearchId !== previousResearch && this.culture.currentResearchId) {
            const tech = this.culture.getCurrentResearch();
            if (tech) {
                this.eventLog.logResearch(tech.name);
            }
        }

        // Mettre à jour l'UI
        this.updateUI();
    }

    render() {
        // Dessiner la carte
        this.map.render();

        // Dessiner toutes les entités
        this.entityManager.draw(this.map.ctx, this.map.tileSize);
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
                this.elements.researchDisplay.textContent = currentResearch.name;

                // Mettre à jour la barre de progression
                if (this.elements.researchProgress) {
                    const progress = this.culture.getResearchProgress();
                    this.elements.researchProgress.style.width = `${progress * 100}%`;
                }
            } else {
                this.elements.researchDisplay.textContent = 'Toutes les technologies débloquées';
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
