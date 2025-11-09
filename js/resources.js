/**
 * ===================================
 * RESOURCES.JS - Système de ressources mondial
 * ===================================
 *
 * Ce module gère :
 * - Les ressources exploitables (wood, stone, iron, gold, food)
 * - Leur distribution sur la carte
 * - Les mines de minerais
 * - Les forêts denses
 * - Les rivières
 */

class ResourceMap {
    constructor(map) {
        this.map = map;

        // Types de ressources
        this.RESOURCE_TYPES = {
            WOOD: 'wood',
            STONE: 'stone',
            IRON: 'iron',
            GOLD: 'gold',
            FOOD: 'food'
        };

        // Grille de densité des ressources (par tuile)
        // Structure: { x, y, resources: { wood: 0-100, stone: 0-100, ... } }
        this.resourceGrid = [];

        // Emplacements de mines (générés aléatoirement dans les montagnes)
        this.mineLocations = [];

        // Zones de forêts denses
        this.denseForests = [];

        // Rivières (chemins d'eau)
        this.rivers = [];

        // Générer les ressources
        this.generate();
    }

    /**
     * Génère les ressources sur toute la carte
     */
    generate() {
        console.log('⛏️ Génération des ressources...');

        this.resourceGrid = [];
        this.mineLocations = [];
        this.denseForests = [];
        this.rivers = [];

        // Initialiser la grille de ressources
        for (let y = 0; y < this.map.height; y++) {
            this.resourceGrid[y] = [];
            for (let x = 0; x < this.map.width; x++) {
                this.resourceGrid[y][x] = this.generateTileResources(x, y);
            }
        }

        // Générer les mines dans les montagnes
        this.generateMines();

        // Générer les forêts denses
        this.generateDenseForests();

        // Générer les rivières
        this.generateRivers();

        console.log(`✅ ${this.mineLocations.length} mines, ${this.denseForests.length} forêts denses, ${this.rivers.length} rivières générées`);
    }

    /**
     * Génère les ressources pour une tuile spécifique
     */
    generateTileResources(x, y) {
        const terrain = this.map.grid[y][x];
        const height = this.map.heightMap[y][x];

        const resources = {
            wood: 0,
            stone: 0,
            iron: 0,
            gold: 0,
            food: 0
        };

        // Distribution selon le type de terrain
        switch (terrain) {
            case this.map.TERRAIN_TYPES.GRASS:
                // Plaines : bois et nourriture
                resources.wood = 20 + Math.random() * 50;
                resources.food = 30 + Math.random() * 40;
                resources.stone = Math.random() * 10;
                break;

            case this.map.TERRAIN_TYPES.ROCK:
                // Montagnes : pierre, fer, or
                resources.stone = 40 + Math.random() * 60;
                resources.iron = 20 + Math.random() * 50;
                resources.gold = Math.random() * 30;
                break;

            case this.map.TERRAIN_TYPES.SAND:
                // Sable : peu de ressources
                resources.stone = 10 + Math.random() * 20;
                resources.food = Math.random() * 15;
                break;

            case this.map.TERRAIN_TYPES.WATER:
                // Eau : nourriture (poissons)
                resources.food = 10 + Math.random() * 30;
                break;
        }

        // Ajouter une variation basée sur la hauteur
        const heightBonus = height * 10;
        if (terrain === this.map.TERRAIN_TYPES.ROCK) {
            resources.iron += heightBonus;
            resources.gold += heightBonus * 0.5;
        }

        return resources;
    }

    /**
     * Génère des mines dans les zones rocheuses riches
     */
    generateMines() {
        const mineCount = Math.floor(this.map.width * this.map.height * 0.003); // ~0.3% de la carte

        for (let i = 0; i < mineCount; i++) {
            // Trouver une position rocheuse avec des ressources
            let attempts = 0;
            let x, y;

            do {
                x = Math.floor(Math.random() * this.map.width);
                y = Math.floor(Math.random() * this.map.height);
                attempts++;

                if (attempts > 1000) break; // Éviter boucle infinie
            } while (
                this.map.grid[y][x] !== this.map.TERRAIN_TYPES.ROCK ||
                this.resourceGrid[y][x].iron < 40
            );

            if (attempts <= 1000) {
                const mineType = Math.random() > 0.7 ? 'gold' : 'iron';

                this.mineLocations.push({
                    x,
                    y,
                    type: mineType,
                    richness: 50 + Math.random() * 150, // Quantité totale de minerai
                    extracted: 0
                });
            }
        }
    }

    /**
     * Génère des zones de forêts denses
     */
    generateDenseForests() {
        const forestCount = Math.floor(this.map.width * this.map.height * 0.005); // ~0.5% de la carte

        for (let i = 0; i < forestCount; i++) {
            // Trouver une zone de plaines
            let attempts = 0;
            let x, y;

            do {
                x = Math.floor(Math.random() * this.map.width);
                y = Math.floor(Math.random() * this.map.height);
                attempts++;

                if (attempts > 1000) break;
            } while (
                this.map.grid[y][x] !== this.map.TERRAIN_TYPES.GRASS ||
                this.resourceGrid[y][x].wood < 50
            );

            if (attempts <= 1000) {
                // Créer une zone de forêt dense (rayon 2-4 tuiles)
                const radius = 2 + Math.floor(Math.random() * 3);

                this.denseForests.push({
                    x,
                    y,
                    radius,
                    density: 0.7 + Math.random() * 0.3 // 70-100% de densité
                });

                // Augmenter les ressources de bois dans la zone
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius) {
                            const tx = x + dx;
                            const ty = y + dy;

                            if (tx >= 0 && tx < this.map.width && ty >= 0 && ty < this.map.height) {
                                if (this.map.grid[ty][tx] === this.map.TERRAIN_TYPES.GRASS) {
                                    const bonus = (1 - dist / radius) * 50;
                                    this.resourceGrid[ty][tx].wood = Math.min(100, this.resourceGrid[ty][tx].wood + bonus);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Génère des rivières reliant des points d'eau
     */
    generateRivers() {
        const riverCount = Math.floor(Math.random() * 3) + 2; // 2-4 rivières

        for (let i = 0; i < riverCount; i++) {
            // Trouver un point de départ dans l'eau
            let startX, startY;
            let attempts = 0;

            do {
                startX = Math.floor(Math.random() * this.map.width);
                startY = Math.floor(Math.random() * this.map.height);
                attempts++;

                if (attempts > 1000) break;
            } while (this.map.grid[startY][startX] !== this.map.TERRAIN_TYPES.WATER);

            if (attempts > 1000) continue;

            // Créer un chemin serpentant
            const riverPath = [];
            let currentX = startX;
            let currentY = startY;
            const maxLength = 20 + Math.floor(Math.random() * 30);

            for (let step = 0; step < maxLength; step++) {
                riverPath.push({ x: currentX, y: currentY });

                // Direction aléatoire avec biais vers le centre (pour rejoindre d'autres eaux)
                const centerX = this.map.width / 2;
                const centerY = this.map.height / 2;

                const towardCenter = Math.random() > 0.3;
                let dx, dy;

                if (towardCenter) {
                    dx = currentX < centerX ? 1 : (currentX > centerX ? -1 : 0);
                    dy = currentY < centerY ? 1 : (currentY > centerY ? -1 : 0);
                } else {
                    dx = Math.floor(Math.random() * 3) - 1;
                    dy = Math.floor(Math.random() * 3) - 1;
                }

                currentX = Math.max(0, Math.min(this.map.width - 1, currentX + dx));
                currentY = Math.max(0, Math.min(this.map.height - 1, currentY + dy));

                // Arrêter si on atteint de l'eau
                if (this.map.grid[currentY][currentX] === this.map.TERRAIN_TYPES.WATER && step > 5) {
                    riverPath.push({ x: currentX, y: currentY });
                    break;
                }
            }

            if (riverPath.length >= 5) {
                this.rivers.push({
                    path: riverPath,
                    width: 1 // Largeur en tuiles
                });
            }
        }
    }

    /**
     * Récupère les ressources d'une tuile
     */
    getTileResources(x, y) {
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
            return null;
        }
        return this.resourceGrid[y][x];
    }

    /**
     * Extrait des ressources d'une tuile
     */
    extractResource(x, y, resourceType, amount) {
        const tile = this.getTileResources(x, y);
        if (!tile || !tile[resourceType]) return 0;

        const extracted = Math.min(amount, tile[resourceType]);
        tile[resourceType] -= extracted;

        return extracted;
    }

    /**
     * Vérifie s'il y a une mine à cette position
     */
    getMineAt(x, y) {
        return this.mineLocations.find(mine => mine.x === x && mine.y === y);
    }

    /**
     * Vérifie s'il y a une forêt dense à cette position
     */
    getDenseForestAt(x, y) {
        return this.denseForests.find(forest => {
            const dx = forest.x - x;
            const dy = forest.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= forest.radius;
        });
    }

    /**
     * Dessine les ressources sur la carte (overlay visuel)
     */
    drawOverlay(ctx, tileSize) {
        // Dessiner les forêts denses (vert foncé)
        this.denseForests.forEach(forest => {
            ctx.fillStyle = 'rgba(27, 94, 32, 0.3)';
            ctx.beginPath();
            ctx.arc(
                forest.x * tileSize + tileSize / 2,
                forest.y * tileSize + tileSize / 2,
                forest.radius * tileSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });

        // Dessiner les rivières (bleu clair)
        this.rivers.forEach(river => {
            ctx.strokeStyle = 'rgba(66, 165, 245, 0.6)';
            ctx.lineWidth = tileSize * river.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            river.path.forEach((point, index) => {
                const x = point.x * tileSize + tileSize / 2;
                const y = point.y * tileSize + tileSize / 2;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        });

        // Dessiner les mines (icône pioche)
        this.mineLocations.forEach(mine => {
            const x = mine.x * tileSize + tileSize / 2;
            const y = mine.y * tileSize + tileSize / 2;

            // Fond
            ctx.fillStyle = mine.type === 'gold' ? '#FFD700' : '#B0BEC5';
            ctx.fillRect(x - tileSize * 0.4, y - tileSize * 0.4, tileSize * 0.8, tileSize * 0.8);

            // Bordure
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - tileSize * 0.4, y - tileSize * 0.4, tileSize * 0.8, tileSize * 0.8);

            // Symbole
            ctx.fillStyle = '#000';
            ctx.font = `${tileSize * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⛏', x, y);
        });
    }

    /**
     * Met à jour les ressources (régénération naturelle)
     */
    update(culture) {
        // Régénération lente des ressources naturelles
        const regrowthRate = culture ? culture.modifiers.treeRegrowthRate : 1.0;

        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.resourceGrid[y][x];
                const terrain = this.map.grid[y][x];

                // Régénération du bois dans les plaines
                if (terrain === this.map.TERRAIN_TYPES.GRASS && tile.wood < 70) {
                    tile.wood = Math.min(70, tile.wood + 0.01 * regrowthRate);
                }

                // Régénération de la nourriture
                if (tile.food < 40) {
                    tile.food = Math.min(40, tile.food + 0.005);
                }
            }
        }
    }
}
