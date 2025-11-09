/**
 * ===================================
 * MAP.JS - Génération et rendu de la carte
 * ===================================
 *
 * Ce module gère :
 * - La génération procédurale de continents réalistes
 * - Multi-octave noise pour des masses terrestres cohérentes
 * - Le rendu pixelisé sur le canvas
 */

class Map {
    constructor(canvas, tileSize = 4) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;

        // Dimensions en tuiles
        this.width = Math.floor(canvas.width / tileSize);
        this.height = Math.floor(canvas.height / tileSize);

        // Grille de la carte (stocke le type de chaque tuile)
        this.grid = [];
        this.heightMap = []; // Carte de hauteur pour la génération

        // Types de terrain
        this.TERRAIN_TYPES = {
            WATER: 0,
            SAND: 1,
            GRASS: 2,
            ROCK: 3
        };

        // Couleurs réalistes pour les biomes
        this.TERRAIN_COLORS = {
            0: '#2b6cb0', // Eau - bleu océan
            1: '#d4b66d', // Sable - beige doré
            2: '#4caf50', // Plaine - vert fertile
            3: '#777777'  // Roche - gris montagne
        };

        // Paramètres de génération
        this.seed = Math.random() * 10000;

        // Générer la carte initiale
        this.generate();
    }

    /**
     * Génère une nouvelle carte avec continents réalistes
     */
    generate() {
        console.log('🗺️ Génération de la carte...');

        // Nouveau seed aléatoire
        this.seed = Math.random() * 10000;

        // Créer la heightmap (carte de hauteur)
        this.generateHeightMap();

        // Convertir la heightmap en types de terrain
        this.generateTerrain();

        // Lisser les transitions pour un rendu plus naturel
        this.smoothTerrain(2); // 2 passes de lissage

        // Dessiner la carte
        this.render();

        console.log('✅ Carte générée avec succès !');
    }

    /**
     * Génère une heightmap avec multi-octave noise
     */
    generateHeightMap() {
        this.heightMap = [];
        const octaves = 4;
        const persistence = 0.5;
        const scale = 50; // Échelle de base

        for (let y = 0; y < this.height; y++) {
            this.heightMap[y] = [];
            for (let x = 0; x < this.width; x++) {
                let noiseValue = 0;
                let amplitude = 1.0;
                let frequency = 1.0;
                let maxValue = 0;

                // Combiner plusieurs octaves
                for (let i = 0; i < octaves; i++) {
                    const sampleX = (x / scale) * frequency;
                    const sampleY = (y / scale) * frequency;

                    const noise = this.improvedNoise(sampleX, sampleY);
                    noiseValue += noise * amplitude;

                    maxValue += amplitude;
                    amplitude *= persistence;
                    frequency *= 2;
                }

                // Normaliser entre 0 et 1
                noiseValue = noiseValue / maxValue;

                // Appliquer un gradient radial pour créer des continents
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                const distX = (x - centerX) / centerX;
                const distY = (y - centerY) / centerY;
                const distFromCenter = Math.sqrt(distX * distX + distY * distY);

                // Gradient doux vers les bords
                const edgeFactor = Math.pow(distFromCenter, 1.3);
                noiseValue = noiseValue * (1.0 - edgeFactor * 0.4);

                // Clamp entre 0 et 1
                this.heightMap[y][x] = Math.max(0, Math.min(1, noiseValue));
            }
        }
    }

    /**
     * Fonction de bruit améliorée et simplifiée
     */
    improvedNoise(x, y) {
        // Utilise une combinaison de sinus/cosinus pour un bruit cohérent
        const a = Math.sin(x * 3.14159 + y * 2.71828 + this.seed) * 0.5;
        const b = Math.cos(x * 2.71828 + y * 1.41421 + this.seed * 2) * 0.3;
        const c = Math.sin((x + y) * 1.73205 + this.seed * 3) * 0.2;

        return a + b + c;
    }

    /**
     * Convertit la heightmap en types de terrain
     */
    generateTerrain() {
        this.grid = [];

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const height = this.heightMap[y][x];

                // Déterminer le type de terrain selon la hauteur
                let terrainType;

                if (height < 0.3) {
                    terrainType = this.TERRAIN_TYPES.WATER; // Océans
                } else if (height < 0.4) {
                    terrainType = this.TERRAIN_TYPES.SAND; // Côtes
                } else if (height < 0.75) {
                    terrainType = this.TERRAIN_TYPES.GRASS; // Plaines
                } else {
                    terrainType = this.TERRAIN_TYPES.ROCK; // Montagnes
                }

                this.grid[y][x] = terrainType;
            }
        }
    }

    /**
     * Lisse le terrain pour des transitions naturelles
     */
    smoothTerrain(passes = 1) {
        for (let pass = 0; pass < passes; pass++) {
            const newGrid = [];

            for (let y = 0; y < this.height; y++) {
                newGrid[y] = [];
                for (let x = 0; x < this.width; x++) {
                    const neighbors = this.getNeighbors(x, y);
                    const counts = [0, 0, 0, 0];

                    // Compter les voisins de chaque type
                    neighbors.forEach(neighbor => {
                        counts[neighbor]++;
                    });

                    const currentType = this.grid[y][x];
                    const maxCount = Math.max(...counts);

                    // Lissage intelligent pour les côtes
                    if (currentType === this.TERRAIN_TYPES.SAND) {
                        const hasWater = neighbors.includes(this.TERRAIN_TYPES.WATER);
                        const hasGrass = neighbors.includes(this.TERRAIN_TYPES.GRASS);

                        if (hasWater && hasGrass) {
                            newGrid[y][x] = this.TERRAIN_TYPES.SAND;
                        } else if (counts[currentType] >= 2) {
                            newGrid[y][x] = currentType;
                        } else {
                            newGrid[y][x] = counts.indexOf(maxCount);
                        }
                    } else if (counts[currentType] < maxCount - 3) {
                        newGrid[y][x] = counts.indexOf(maxCount);
                    } else {
                        newGrid[y][x] = currentType;
                    }
                }
            }

            this.grid = newGrid;
        }
    }

    /**
     * Récupère les voisins d'une tuile (8 directions)
     */
    getNeighbors(x, y) {
        const neighbors = [];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

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
        console.log('🎨 Rendu de la carte...');

        // Fond noir
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner chaque tuile
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrainType = this.grid[y][x];
                let color = this.TERRAIN_COLORS[terrainType];

                // Légère variation de couleur basée sur la heightmap
                const height = this.heightMap[y][x];
                const variation = (height % 0.15) - 0.075; // Entre -0.075 et 0.075

                if (variation !== 0) {
                    color = this.adjustBrightness(color, variation);
                }

                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }

        console.log('✅ Rendu terminé !');
    }

    /**
     * Ajuste la luminosité d'une couleur hex
     */
    adjustBrightness(hex, amount) {
        // Parse le hex
        const num = parseInt(hex.slice(1), 16);

        // Extraire RGB
        let r = (num >> 16) & 0xff;
        let g = (num >> 8) & 0xff;
        let b = num & 0xff;

        // Ajuster
        r = Math.max(0, Math.min(255, Math.floor(r + amount * 50)));
        g = Math.max(0, Math.min(255, Math.floor(g + amount * 50)));
        b = Math.max(0, Math.min(255, Math.floor(b + amount * 50)));

        // Reconvertir en hex
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Met à jour la carte (pour évolutions futures)
     */
    update() {
        // Pour le moment, la carte est statique
        // Futurs ajouts : érosion, tectonique, climat, etc.
    }
}
