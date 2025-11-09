/**
 * ===================================
 * MAP.JS - Génération et rendu de la carte
 * ===================================
 *
 * Ce module gère :
 * - La génération procédurale de continents réalistes
 * - Multi-octave Perlin noise pour des masses terrestres cohérentes
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

        // Paramètres de génération multi-octave
        this.seed = Math.random() * 10000;
        this.octaves = 4; // Nombre de couches de bruit
        this.persistence = 0.5; // Influence des octaves suivantes
        this.lacunarity = 2.0; // Fréquence des octaves

        // Générer la carte initiale
        this.generate();
    }

    /**
     * Génère une nouvelle carte avec continents réalistes
     */
    generate() {
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
    }

    /**
     * Génère une heightmap avec multi-octave Perlin noise
     */
    generateHeightMap() {
        this.heightMap = [];

        for (let y = 0; y < this.height; y++) {
            this.heightMap[y] = [];
            for (let x = 0; x < this.width; x++) {
                let amplitude = 1.0;
                let frequency = 1.0;
                let noiseHeight = 0;
                let amplitudeSum = 0;

                // Combiner plusieurs octaves de bruit
                for (let i = 0; i < this.octaves; i++) {
                    const sampleX = (x / this.width) * frequency;
                    const sampleY = (y / this.height) * frequency;

                    const perlinValue = this.perlinNoise(sampleX, sampleY);
                    noiseHeight += perlinValue * amplitude;

                    amplitudeSum += amplitude;
                    amplitude *= this.persistence;
                    frequency *= this.lacunarity;
                }

                // Normaliser
                noiseHeight /= amplitudeSum;

                // Appliquer un gradient radial pour créer des îles/continents
                // (optionnel : désactivé pour avoir une vraie carte de continents)
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                const distX = (x - centerX) / centerX;
                const distY = (y - centerY) / centerY;
                const distFromCenter = Math.sqrt(distX * distX + distY * distY);

                // Appliquer un léger effet de bord (plus d'eau sur les bords)
                const edgeFactor = Math.pow(distFromCenter, 1.2);
                noiseHeight = noiseHeight * (1.0 - edgeFactor * 0.3);

                // Clamp entre 0 et 1
                this.heightMap[y][x] = Math.max(0, Math.min(1, noiseHeight));
            }
        }
    }

    /**
     * Implémentation simplifiée de Perlin noise
     */
    perlinNoise(x, y) {
        // Grille de base
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        // Poids d'interpolation
        const sx = x - x0;
        const sy = y - y0;

        // Interpolation avec smoothstep
        const smoothX = this.smoothstep(sx);
        const smoothY = this.smoothstep(sy);

        // Vecteurs de gradient pseudo-aléatoires
        const n0 = this.dotGridGradient(x0, y0, x, y);
        const n1 = this.dotGridGradient(x1, y0, x, y);
        const ix0 = this.lerp(n0, n1, smoothX);

        const n2 = this.dotGridGradient(x0, y1, x, y);
        const n3 = this.dotGridGradient(x1, y1, x, y);
        const ix1 = this.lerp(n2, n3, smoothX);

        const value = this.lerp(ix0, ix1, smoothY);

        // Normaliser entre 0 et 1
        return (value + 1) / 2;
    }

    /**
     * Produit scalaire avec gradient pseudo-aléatoire
     */
    dotGridGradient(ix, iy, x, y) {
        // Gradient pseudo-aléatoire
        const random = this.pseudoRandom(ix, iy);
        const angle = random * 2 * Math.PI;

        const gradX = Math.cos(angle);
        const gradY = Math.sin(angle);

        // Vecteur de distance
        const dx = x - ix;
        const dy = y - iy;

        // Produit scalaire
        return dx * gradX + dy * gradY;
    }

    /**
     * Générateur pseudo-aléatoire déterministe
     */
    pseudoRandom(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453123;
        return n - Math.floor(n);
    }

    /**
     * Interpolation linéaire
     */
    lerp(a, b, t) {
        return a + t * (b - a);
    }

    /**
     * Fonction de lissage (smoothstep)
     */
    smoothstep(t) {
        return t * t * (3 - 2 * t);
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

                    // Lissage plus agressif pour les côtes
                    if (currentType === this.TERRAIN_TYPES.SAND) {
                        // Le sable reste sable s'il touche l'eau
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
                        // Changer pour le type dominant si très minoritaire
                        newGrid[y][x] = counts.indexOf(maxCount);
                    } else {
                        // Garder le type actuel
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
        if (!this.ctx) {
            console.error('Canvas context not available');
            return;
        }

        if (!this.grid || this.grid.length === 0) {
            console.error('Map grid not generated');
            return;
        }

        // Fond noir
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner chaque tuile
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrainType = this.grid[y][x];
                const color = this.TERRAIN_COLORS[terrainType];

                // Variation de couleur pour plus de réalisme
                const variation = (this.heightMap[y][x] % 0.1) * 0.2;
                const adjustedColor = this.adjustBrightness(color, variation - 0.1);

                this.ctx.fillStyle = adjustedColor;
                this.ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }

        console.log('Map rendered successfully');
    }

    /**
     * Ajuste la luminosité d'une couleur hex
     */
    adjustBrightness(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount * 255));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount * 255));
        const b = Math.max(0, Math.min(255, (num & 0xff) + amount * 255));

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Met à jour la carte (pour évolutions futures)
     */
    update() {
        // Pour le moment, la carte est statique
        // Futurs ajouts : érosion, tectonique, climat, etc.
    }
}
