/**
 * ===================================
 * MAIN.JS - Contrôleur principal de la simulation
 * ===================================
 *
 * Ce module gère :
 * - L'initialisation de la simulation
 * - La boucle principale (requestAnimationFrame)
 * - Le temps simulé et la vitesse
 * - Les contrôles utilisateur (play/pause, vitesse)
 * - La mise à jour de l'interface
 */

class Simulation {
    constructor() {
        // Récupérer le canvas
        this.canvas = document.getElementById('mainCanvas');

        // Créer la carte avec continents réalistes
        this.map = new Map(this.canvas, 4); // Taille de tuile : 4px

        // État de la simulation
        this.isRunning = false;
        this.currentYear = 0;
        this.speed = 1; // Vitesse : 1, 2, ou 4
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // 30 FPS

        // Récupérer les éléments du DOM (nouveaux IDs)
        this.elements = {
            yearDisplay: document.getElementById('yearDisplay'),
            speedDisplay: document.getElementById('speedDisplay'),
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

        // Effectuer le rendu initial de la carte
        this.render();
    }

    /**
     * Initialise les événements des contrôles
     */
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

    /**
     * Bascule entre play et pause
     */
    togglePlayPause() {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            // Mode lecture
            this.elements.mainPlayIcon.textContent = '⏸';
            this.elements.mainPlayText.textContent = 'En cours...';
            this.elements.mainPlayBtn.classList.add('playing');
            this.lastFrameTime = performance.now();
            this.start();
        } else {
            // Mode pause
            this.elements.mainPlayIcon.textContent = '▶';
            this.elements.mainPlayText.textContent = 'Evolution Simulator';
            this.elements.mainPlayBtn.classList.remove('playing');
        }
    }

    /**
     * Définit la vitesse de simulation
     */
    setSpeed(speed) {
        this.speed = speed;
        this.updateSpeedButtons();
        this.updateUI();
    }

    /**
     * Met à jour l'affichage des boutons de vitesse
     */
    updateSpeedButtons() {
        // Retirer la classe active de tous les boutons
        this.elements.speed1Btn.classList.remove('active');
        this.elements.speed2Btn.classList.remove('active');
        this.elements.speed4Btn.classList.remove('active');

        // Ajouter la classe active au bouton sélectionné
        if (this.speed === 1) {
            this.elements.speed1Btn.classList.add('active');
        } else if (this.speed === 2) {
            this.elements.speed2Btn.classList.add('active');
        } else if (this.speed === 4) {
            this.elements.speed4Btn.classList.add('active');
        }
    }

    /**
     * Démarre la boucle de simulation
     */
    start() {
        if (this.isRunning) {
            requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    /**
     * Boucle principale de la simulation
     */
    loop(timestamp) {
        // Vérifier si on doit continuer
        if (!this.isRunning) return;

        // Calculer le delta time
        const deltaTime = timestamp - this.lastFrameTime;

        // Limiter à 30 FPS pour une progression fluide
        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = timestamp;

            // Mettre à jour la simulation
            this.update();

            // Dessiner (pour le moment, la carte est statique)
            this.render();
        }

        // Continuer la boucle
        requestAnimationFrame((ts) => this.loop(ts));
    }

    /**
     * Met à jour l'état de la simulation
     */
    update() {
        // Incrémenter l'année selon la vitesse
        // À 30 FPS :
        // - vitesse x1 = progression normale (~15 ans/sec)
        // - vitesse x2 = deux fois plus rapide (~30 ans/sec)
        // - vitesse x4 = quatre fois plus rapide (~60 ans/sec)

        const yearIncrement = this.speed * 0.5;
        this.currentYear += yearIncrement;

        // Mettre à jour la carte (pour le moment, statique)
        this.map.update();

        // Mettre à jour l'interface
        this.updateUI();
    }

    /**
     * Effectue le rendu
     */
    render() {
        // Dessiner la carte
        this.map.render();
    }

    /**
     * Met à jour l'interface utilisateur
     */
    updateUI() {
        // Afficher l'année (arrondie et formatée)
        this.elements.yearDisplay.textContent = Math.floor(this.currentYear).toLocaleString('fr-FR');

        // Afficher la vitesse
        this.elements.speedDisplay.textContent = `x${this.speed}`;
    }
}

// ===================================
// INITIALISATION
// ===================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Créer et lancer la simulation
    const simulation = new Simulation();

    console.log('🌍 Evolution Simulator initialisé !');
    console.log('📊 Carte générée :', simulation.map.width, 'x', simulation.map.height, 'tuiles');
    console.log('🎮 Cliquez sur le bouton principal pour démarrer');
    console.log('📖 Cliquez sur le livre pour afficher le guide');
});
