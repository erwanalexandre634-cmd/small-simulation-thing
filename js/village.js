/**
 * ===================================
 * VILLAGE.JS - Système de villages et cultures
 * ===================================
 *
 * Ce module gère :
 * - Formation automatique de villages
 * - Chefs de village et leadership
 * - Territoires et frontières
 * - Ressources communautaires
 * - Traits culturels distincts
 */

/**
 * Village - Groupement d'humains et de bâtiments
 */
class Village {
    constructor(id, name, centerX, centerY) {
        this.id = id;
        this.name = name;
        this.centerX = centerX;
        this.centerY = centerY;

        // Population
        this.humans = [];
        this.leader = null;

        // Bâtiments
        this.buildings = [];
        this.houses = [];

        // Ressources communes
        this.resources = {
            wood: 50,
            stone: 30,
            iron: 0,
            gold: 0,
            food: 100,
            tools: 0
        };

        // Recherche locale (points accumulés)
        this.researchPoints = 0;
        this.currentResearch = null;

        // Territoire (liste de coordonnées)
        this.territory = [];
        this.color = this.generateColor();

        // Traits culturels
        this.cultureTraits = this.generateCultureTraits();

        // Statistiques
        this.founded = 0; // Année de fondation
        this.totalBirths = 0;
        this.totalDeaths = 0;

        // Génération initiale du territoire
        this.expandTerritory(5); // Rayon initial de 5 tuiles
    }

    /**
     * Génère une couleur unique pour le village
     */
    generateColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60 + Math.floor(Math.random() * 20);
        const lightness = 50 + Math.floor(Math.random() * 10);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * Génère des traits culturels aléatoires
     */
    generateCultureTraits() {
        const traits = {
            // Tendances comportementales (0-1)
            expansionism: Math.random(), // Envie d'expansion territoriale
            pacifism: Math.random(), // Tendance pacifique
            innovation: Math.random(), // Vitesse de recherche
            collectivism: Math.random(), // Partage des ressources
            nomadism: 0.2 + Math.random() * 0.3, // Tendance à se déplacer (faible au début)

            // Priorités
            priorities: {
                research: Math.random(),
                construction: Math.random(),
                agriculture: Math.random(),
                exploration: Math.random()
            }
        };

        // Normaliser les priorités
        const total = Object.values(traits.priorities).reduce((a, b) => a + b, 0);
        for (let key in traits.priorities) {
            traits.priorities[key] /= total;
        }

        return traits;
    }

    /**
     * Élire un nouveau chef
     */
    electLeader() {
        if (this.humans.length === 0) {
            this.leader = null;
            return;
        }

        // Le chef est le plus âgé ou celui avec les meilleurs gènes
        this.humans.sort((a, b) => {
            const scoreA = a.age + (a.genes.intelligence || 1.0) * 10;
            const scoreB = b.age + (b.genes.intelligence || 1.0) * 10;
            return scoreB - scoreA;
        });

        const newLeader = this.humans[0];

        if (this.leader !== newLeader) {
            this.leader = newLeader;
            return { type: 'leaderChange', village: this, leader: newLeader };
        }
    }

    /**
     * Ajoute un humain au village
     */
    addHuman(human) {
        if (!this.humans.includes(human)) {
            this.humans.push(human);
            human.villageId = this.id;

            if (!this.leader) {
                this.electLeader();
            }
        }
    }

    /**
     * Retire un humain du village
     */
    removeHuman(human) {
        const index = this.humans.indexOf(human);
        if (index > -1) {
            this.humans.splice(index, 1);
            human.villageId = null;

            if (this.leader === human) {
                this.electLeader();
            }
        }
    }

    /**
     * Ajoute un bâtiment au village
     */
    addBuilding(building) {
        if (!this.buildings.includes(building)) {
            this.buildings.push(building);
            building.villageId = this.id;

            if (building.type === 'house') {
                this.houses.push(building);
            }
        }
    }

    /**
     * Étend le territoire du village
     */
    expandTerritory(radius) {
        this.territory = [];

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= radius) {
                    const x = Math.floor(this.centerX + dx);
                    const y = Math.floor(this.centerY + dy);

                    this.territory.push({ x, y });
                }
            }
        }
    }

    /**
     * Vérifie si une position est dans le territoire
     */
    isInTerritory(x, y) {
        return this.territory.some(tile => tile.x === x && tile.y === y);
    }

    /**
     * Ajoute des ressources au village
     */
    addResource(resourceType, amount) {
        if (this.resources[resourceType] !== undefined) {
            this.resources[resourceType] += amount;
        }
    }

    /**
     * Retire des ressources du village
     */
    removeResource(resourceType, amount) {
        if (this.resources[resourceType] !== undefined) {
            const removed = Math.min(amount, this.resources[resourceType]);
            this.resources[resourceType] -= removed;
            return removed;
        }
        return 0;
    }

    /**
     * Met à jour le village
     */
    update(culture, map) {
        // Vérifier si le village doit s'étendre
        const populationDensity = this.humans.length / this.territory.length;

        if (populationDensity > 0.1 && Math.random() < this.cultureTraits.expansionism * 0.01) {
            const currentRadius = Math.sqrt(this.territory.length / Math.PI);
            this.expandTerritory(Math.floor(currentRadius + 1));
        }

        // Contribution aux RP globaux
        if (culture && this.researchPoints > 10) {
            const contribution = this.researchPoints * this.cultureTraits.innovation;
            culture.addResearchPoints(contribution * 0.1);
            this.researchPoints -= contribution * 0.1;
        }

        // Réélire le chef si nécessaire
        if (!this.leader || !this.humans.includes(this.leader)) {
            this.electLeader();
        }
    }

    /**
     * Dessine le territoire du village
     */
    drawTerritory(ctx, tileSize, alpha = 0.2) {
        ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);

        this.territory.forEach(tile => {
            ctx.fillRect(
                tile.x * tileSize,
                tile.y * tileSize,
                tileSize,
                tileSize
            );
        });

        // Dessiner la frontière
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        // Trouver les tuiles de bordure
        const borderTiles = this.territory.filter(tile => {
            const neighbors = [
                { x: tile.x - 1, y: tile.y },
                { x: tile.x + 1, y: tile.y },
                { x: tile.x, y: tile.y - 1 },
                { x: tile.x, y: tile.y + 1 }
            ];

            return neighbors.some(n => !this.isInTerritory(n.x, n.y));
        });

        borderTiles.forEach(tile => {
            ctx.strokeRect(
                tile.x * tileSize,
                tile.y * tileSize,
                tileSize,
                tileSize
            );
        });
    }

    /**
     * Dessine les infos du village
     */
    drawInfo(ctx, tileSize) {
        const x = this.centerX * tileSize;
        const y = this.centerY * tileSize - tileSize * 2;

        // Fond
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 50, y - 20, 100, 40);

        // Nom
        ctx.fillStyle = this.color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, x, y - 5);

        // Population
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.fillText(`Pop: ${this.humans.length}`, x, y + 10);
    }

    /**
     * Obtient le statut du village
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            population: this.humans.length,
            leader: this.leader ? this.leader.name || 'Anonyme' : 'Aucun',
            resources: { ...this.resources },
            territory: this.territory.length,
            buildings: this.buildings.length,
            traits: this.cultureTraits
        };
    }
}

/**
 * Gestionnaire de villages
 */
class VillageManager {
    constructor() {
        this.villages = [];
        this.nextVillageId = 1;
        this.villageNames = this.generateVillageNames();
    }

    /**
     * Génère une liste de noms de villages
     */
    generateVillageNames() {
        const prefixes = ['Nova', 'Alta', 'Prima', 'Terra', 'Luna', 'Sol', 'Stella', 'Aqua', 'Flora', 'Petra'];
        const suffixes = ['ville', 'bourg', 'cité', 'haven', 'port', 'dale', 'heim', 'grad', 'polis', 'town'];

        const names = [];
        prefixes.forEach(prefix => {
            suffixes.forEach(suffix => {
                names.push(prefix + suffix);
            });
        });

        // Mélanger
        for (let i = names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [names[i], names[j]] = [names[j], names[i]];
        }

        return names;
    }

    /**
     * Crée un nouveau village
     */
    createVillage(centerX, centerY, currentYear) {
        const id = this.nextVillageId++;
        const name = this.villageNames[this.villages.length % this.villageNames.length];

        const village = new Village(id, name, centerX, centerY);
        village.founded = currentYear;

        this.villages.push(village);

        console.log(`🏘️ Nouveau village fondé : ${name} (${this.villages.length} villages au total)`);

        return village;
    }

    /**
     * Détecte et forme automatiquement des villages
     */
    detectAndFormVillages(humans, houses, map, currentYear) {
        const newVillages = [];

        // Regrouper les maisons proches
        const houseClusters = this.clusterHouses(houses, 10); // Rayon de 10 tuiles

        houseClusters.forEach(cluster => {
            // Vérifier si ce cluster fait déjà partie d'un village
            const existingVillage = this.villages.find(v =>
                cluster.some(house => v.houses.includes(house))
            );

            if (!existingVillage && cluster.length >= 3) {
                // Créer un nouveau village
                const centerX = Math.floor(cluster.reduce((sum, h) => sum + h.x, 0) / cluster.length);
                const centerY = Math.floor(cluster.reduce((sum, h) => sum + h.y, 0) / cluster.length);

                const village = this.createVillage(centerX, centerY, currentYear);

                // Ajouter les maisons au village
                cluster.forEach(house => village.addBuilding(house));

                // Assigner les humains proches
                humans.forEach(human => {
                    const dx = human.x - centerX;
                    const dy = human.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist <= 10 && !human.villageId) {
                        village.addHuman(human);
                    }
                });

                newVillages.push(village);
            }
        });

        return newVillages;
    }

    /**
     * Regroupe les maisons en clusters
     */
    clusterHouses(houses, maxDistance) {
        const clusters = [];
        const assigned = new Set();

        houses.forEach(house => {
            if (assigned.has(house)) return;

            const cluster = [house];
            assigned.add(house);

            // Trouver toutes les maisons à proximité
            const queue = [house];

            while (queue.length > 0) {
                const current = queue.shift();

                houses.forEach(other => {
                    if (assigned.has(other)) return;

                    const dx = other.x - current.x;
                    const dy = other.y - current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist <= maxDistance) {
                        cluster.push(other);
                        assigned.add(other);
                        queue.push(other);
                    }
                });
            }

            if (cluster.length >= 1) {
                clusters.push(cluster);
            }
        });

        return clusters;
    }

    /**
     * Trouve le village d'un humain
     */
    getVillageOfHuman(human) {
        return this.villages.find(v => v.humans.includes(human));
    }

    /**
     * Trouve le village à une position
     */
    getVillageAtPosition(x, y) {
        return this.villages.find(v => v.isInTerritory(x, y));
    }

    /**
     * Met à jour tous les villages
     */
    update(culture, map) {
        this.villages.forEach(village => village.update(culture, map));

        // Supprimer les villages vides
        this.villages = this.villages.filter(v => v.humans.length > 0 || v.buildings.length > 0);
    }

    /**
     * Dessine tous les villages
     */
    draw(ctx, tileSize, showTerritories = true, showInfo = true) {
        // Dessiner les territoires
        if (showTerritories) {
            this.villages.forEach(village => village.drawTerritory(ctx, tileSize));
        }

        // Dessiner les infos
        if (showInfo) {
            this.villages.forEach(village => village.drawInfo(ctx, tileSize));
        }
    }

    /**
     * Obtient les statistiques de tous les villages
     */
    getStatistics() {
        return this.villages.map(v => v.getStatus());
    }
}
