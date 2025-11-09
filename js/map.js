/**
 * ===================================
 * MAP.JS - Génération et rendu de la carte
 * ===================================
 *
 * Ce module gère :
 * - La génération procédurale de la carte
 * - Le système de bruit pour créer des biomes cohérents
 * - Le rendu pixelisé sur le canvas
 */

class Map {
    constructor(canvas, tileSize = 4) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize; // Taille d'un pixel/tuile en pixels réels

        // Dimensions en tuiles
        this.width = Math.floor(canvas.width / tileSize);
        this.height = Math.floor(canvas.height / tileSize);

        // Grille de la carte (stocke le type de chaque tuile)
        this.grid = [];

        // Types de terrain
        this.TERRAIN_TYPES = {
            WATER: 0,
            SAND: 1,
            GRASS: 2,
            ROCK: 3
        };

        // Couleurs associées
        this.TERRAIN_COLORS = {
            0: '#2196F3', // Eau - bleu
            1: '#FDD835', // Sable - jaune pâle
            2: '#4CAF50', // Plaine - vert
            3: '#757575'  // Roche - gris
        };

        // Paramètres de génération
        this.seed = Math.random() * 1000;
        this.noiseScale = 0.05; // Échelle du bruit (plus petit = plus grands biomes)

        // Générer la carte initiale
        this.generate();
    }

    /**
     * Génère une nouvelle carte procédurale
     */
    generate() {
        // Nouveau seed pour varier la génération
        this.seed = Math.random() * 1000;

        // Initialiser la grille
        this.grid = [];

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Générer une valeur de bruit entre 0 et 1
                const noiseValue = this.noise(x * this.noiseScale, y * this.noiseScale);

                // Ajouter un peu de variation locale
                const variation = Math.random() * 0.1;
                const finalValue = noiseValue + variation;

                // Déterminer le type de terrain selon la valeur
                let terrainType;

                if (finalValue < 0.35) {
                    terrainType = this.TERRAIN_TYPES.WATER; // Eau
                } else if (finalValue < 0.45) {
                    terrainType = this.TERRAIN_TYPES.SAND; // Sable (bordure d'eau)
                } else if (finalValue < 0.85) {
                    terrainType = this.TERRAIN_TYPES.GRASS; // Plaine
                } else {
                    terrainType = this.TERRAIN_TYPES.ROCK; // Roche (plus rare)
                }

                this.grid[y][x] = terrainType;
            }
        }

        // Appliquer un lissage pour rendre les biomes plus cohérents
        this.smoothTerrain();

        // Dessiner la carte
        this.render();
    }

    /**
     * Fonction de bruit simplifié (Perlin-like)
     * Génère des valeurs cohérentes spatially
     */
    noise(x, y) {
        // Utilise une combinaison de sinus/cosinus pour simuler un bruit cohérent
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        const noise1 = (n - Math.floor(n));

        const n2 = Math.cos(x * 34.5123 + y * 23.456 + this.seed * 2) * 12345.6789;
        const noise2 = (n2 - Math.floor(n2));

        // Moyenne pondérée
        return (noise1 * 0.6 + noise2 * 0.4);
    }

    /**
     * Lisse le terrain pour éviter les pixels isolés
     * Utilise un algorithme de cellular automata simplifié
     */
    smoothTerrain() {
        const newGrid = [];

        for (let y = 0; y < this.height; y++) {
            newGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const neighbors = this.getNeighbors(x, y);
                const counts = [0, 0, 0, 0]; // Compteur pour chaque type

                // Compter les voisins de chaque type
                neighbors.forEach(neighbor => {
                    counts[neighbor]++;
                });

                // Si un type domine largement, adopter ce type
                const currentType = this.grid[y][x];
                const maxCount = Math.max(...counts);

                if (counts[currentType] < maxCount - 2) {
                    // Changer pour le type dominant
                    newGrid[y][x] = counts.indexOf(maxCount);
                } else {
                    // Garder le type actuel
                    newGrid[y][x] = currentType;
                }
            }
        }

        this.grid = newGrid;
    }

    /**
     * Récupère les voisins d'une tuile (8 directions)
     */
    getNeighbors(x, y) {
        const neighbors = [];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Ignorer le centre

                const nx = x + dx;
                const ny = y + dy;

                // Vérifier les limites
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    neighbors.push(this.grid[ny][nx]);
                }
            }
        }

        return neighbors;
    }

    /**
     * Dessine la carte sur le canvas
     */
    render() {
        // Nettoyer le canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner chaque tuile
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrainType = this.grid[y][x];
                const color = this.TERRAIN_COLORS[terrainType];

                // Dessiner le pixel/tuile
                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }

    /**
     * Met à jour la carte (pour le moment, juste le rendu)
     * Cette fonction sera utilisée plus tard pour les changements dynamiques
     */
    update() {
        // Pour le moment, la carte est statique
        // On pourra ajouter ici l'évolution du terrain, érosion, etc.
    }
}
