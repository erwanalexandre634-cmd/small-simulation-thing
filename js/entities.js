/**
 * ===================================
 * ENTITIES.JS - Système de vie et évolution (VERSION AMÉLIORÉE)
 * ===================================
 *
 * Améliorations :
 * - Visuels stylisés (arbres organiques, rochers polygonaux, etc.)
 * - Barres d'action au-dessus des humains
 * - Spawn uniquement sur terre (pas dans l'eau)
 * - IA robuste avec validation des targets
 * - Clamp de toutes les valeurs
 * - Génération de points de recherche (RP)
 */

/**
 * Classe de base pour toutes les entités
 */
class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

/**
 * Arbre - Source de nourriture sur les plaines
 * Visuel : Couronne organique + tronc
 */
class Tree extends Entity {
    constructor(x, y) {
        super(x, y, 'tree');
        this.food = 50;
    }

    draw(ctx, tileSize) {
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;

        // Tronc
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(
            centerX - tileSize * 0.15,
            centerY,
            tileSize * 0.3,
            tileSize * 0.5
        );

        // Couronne (3 cercles pour effet organique)
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(centerX, centerY - tileSize * 0.2, tileSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(centerX - tileSize * 0.2, centerY - tileSize * 0.1, tileSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX + tileSize * 0.2, centerY - tileSize * 0.1, tileSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Rocher - Élément décoratif sur les montagnes
 * Visuel : Polygone irrégulier
 */
class Rock extends Entity {
    constructor(x, y) {
        super(x, y, 'rock');
        // Générer une forme aléatoire unique pour chaque rocher
        this.shape = this.generateShape();
    }

    generateShape() {
        const points = [];
        const numPoints = 5 + Math.floor(Math.random() * 3); // 5-7 points

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.2; // Variation du rayon
            points.push({ angle, radius });
        }

        return points;
    }

    draw(ctx, tileSize) {
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;

        // Dessiner le polygone irrégulier
        ctx.fillStyle = '#757575';
        ctx.beginPath();

        this.shape.forEach((point, i) => {
            const x = centerX + Math.cos(point.angle) * tileSize * point.radius;
            const y = centerY + Math.sin(point.angle) * tileSize * point.radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.fill();

        // Ombre légère
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        const offset = tileSize * 0.1;
        this.shape.forEach((point, i) => {
            const x = centerX + Math.cos(point.angle) * tileSize * point.radius * 0.8 + offset;
            const y = centerY + Math.sin(point.angle) * tileSize * point.radius * 0.8 + offset;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * Maison - Abri construit par les humains
 * Visuel : Rectangle + toit triangulaire + porte
 */
class House extends Entity {
    constructor(x, y, ownerId) {
        super(x, y, 'house');
        this.ownerId = ownerId;
    }

    draw(ctx, tileSize) {
        const baseX = this.x * tileSize;
        const baseY = this.y * tileSize;

        // Murs
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(baseX + tileSize * 0.1, baseY + tileSize * 0.3, tileSize * 0.8, tileSize * 0.6);

        // Toit
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(baseX, baseY + tileSize * 0.3);
        ctx.lineTo(baseX + tileSize * 0.5, baseY);
        ctx.lineTo(baseX + tileSize, baseY + tileSize * 0.3);
        ctx.closePath();
        ctx.fill();

        // Porte
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(baseX + tileSize * 0.35, baseY + tileSize * 0.5, tileSize * 0.3, tileSize * 0.4);

        // Fenêtre
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(baseX + tileSize * 0.2, baseY + tileSize * 0.4, tileSize * 0.15, tileSize * 0.15);
    }
}

/**
 * Humain - Entité autonome avec IA et évolution
 * Visuel : Tête + corps + bras/jambes
 */
class Human extends Entity {
    constructor(x, y, generation = 0, genes = null) {
        super(x, y, 'human');

        this.id = Math.random().toString(36).substr(2, 9);

        // Besoins (CLAMPED 0-100)
        this.energy = 100;
        this.hunger = 30;
        this.thirst = 30;

        // Maison
        this.hasHouse = false;
        this.houseX = null;
        this.houseY = null;

        // Âge et génération
        this.age = 0;
        this.generation = generation;
        this.reproductionCooldown = 0;

        // Gènes
        if (genes) {
            this.genes = { ...genes };
            this.mutateGenes();
        } else {
            this.genes = {
                speed: 1.0,
                efficiency: 1.0,
                metabolism: 1.0
            };
        }

        // État et action
        this.state = 'idle';
        this.targetX = null;
        this.targetY = null;
        this.targetEntity = null;

        // NOUVEAU : Action en cours avec progression
        this.currentAction = null; // 'drinking', 'eating', 'building', 'resting'
        this.actionProgress = 0; // 0..1
        this.actionDuration = 0; // Durée totale de l'action
    }

    mutateGenes() {
        const mutationRate = 0.1;

        for (let gene in this.genes) {
            const mutation = (Math.random() - 0.5) * 2 * mutationRate;
            this.genes[gene] *= (1 + mutation);
            this.genes[gene] = Math.max(0.5, Math.min(2.0, this.genes[gene]));
        }
    }

    /**
     * CLAMP : S'assure qu'une valeur reste dans une plage
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    update(map, entities, culture) {
        // Vieillir
        this.age += 0.01;

        // Cooldown de reproduction
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown -= 0.1;
        }

        // Consommer de l'énergie (modifié par métabolisme et culture)
        const metabolismFactor = this.genes.metabolism * (culture ? (1 / culture.modifiers.lifespanBonus) : 1);
        this.energy -= 0.05 * metabolismFactor;

        // Augmenter la faim et la soif (modifié par culture)
        this.hunger += 0.08;
        const thirstRate = culture ? (0.06 * culture.modifiers.thirstReduction) : 0.06;
        this.thirst += thirstRate;

        // CLAMP toutes les valeurs
        this.energy = this.clamp(this.energy, 0, 100);
        this.hunger = this.clamp(this.hunger, 0, 100);
        this.thirst = this.clamp(this.thirst, 0, 100);

        // Vérifier la mort
        if (this.energy <= 0 || this.hunger >= 100 || this.thirst >= 100) {
            return false; // Mort
        }

        // Mettre à jour l'action en cours
        this.updateCurrentAction();

        // Prendre des décisions
        this.decideBehavior(map, entities);

        // Exécuter le comportement
        this.executeBehavior(map, entities, culture);

        return true; // Vivant
    }

    /**
     * Met à jour la progression de l'action en cours
     */
    updateCurrentAction() {
        if (this.currentAction && this.actionDuration > 0) {
            this.actionProgress += 1 / this.actionDuration;

            // Action terminée
            if (this.actionProgress >= 1) {
                this.currentAction = null;
                this.actionProgress = 0;
                this.actionDuration = 0;
            }
        }
    }

    /**
     * Démarre une action
     */
    startAction(actionType, duration) {
        this.currentAction = actionType;
        this.actionProgress = 0;
        this.actionDuration = duration;
    }

    decideBehavior(map, entities) {
        // Ne pas changer d'état si une action est en cours
        if (this.currentAction) return;

        // Priorité 1: Faim critique
        if (this.hunger > 70 && this.state !== 'searchingFood') {
            this.state = 'searchingFood';
            this.findNearestTree(entities);
        }
        // Priorité 2: Soif critique
        else if (this.thirst > 70 && this.state !== 'searchingWater') {
            this.state = 'searchingWater';
            this.findNearestWater(map);
        }
        // Priorité 3: Énergie basse
        else if (this.energy < 40 && this.hasHouse && this.state !== 'resting') {
            this.state = 'resting';
            this.targetX = this.houseX;
            this.targetY = this.houseY;
        }
        // Priorité 4: Construire une maison
        else if (!this.hasHouse && this.hunger < 50 && this.thirst < 50 && this.energy > 60) {
            if (this.state !== 'building') {
                this.state = 'building';
                this.findBuildingSpot(map, entities);
            }
        }
        // Gestion proactive
        else if (this.state === 'idle') {
            if (this.hunger > 40) {
                this.state = 'searchingFood';
                this.findNearestTree(entities);
            } else if (this.thirst > 40) {
                this.state = 'searchingWater';
                this.findNearestWater(map);
            }
        }
    }

    executeBehavior(map, entities, culture) {
        switch (this.state) {
            case 'searchingFood':
                // Valider que la target existe toujours
                if (this.targetEntity && !entities.trees.includes(this.targetEntity)) {
                    this.targetEntity = null;
                    this.findNearestTree(entities);
                }

                if (this.targetEntity && this.targetEntity.type === 'tree') {
                    if (this.moveTowards(this.targetEntity.x, this.targetEntity.y, culture)) {
                        // Commencer l'action de manger
                        this.startAction('eating', 30); // 30 ticks pour manger

                        // Après l'action
                        const gatheringBonus = culture ? culture.modifiers.gatheringBonus : 1.0;
                        const foodEfficiency = culture ? culture.modifiers.foodEfficiency : 1.0;
                        this.hunger -= 50 * this.genes.efficiency * gatheringBonus * foodEfficiency;
                        this.energy += 20 * this.genes.efficiency;
                        this.hunger = this.clamp(this.hunger, 0, 100);
                        this.energy = this.clamp(this.energy, 0, 100);

                        // Supprimer l'arbre
                        const index = entities.trees.indexOf(this.targetEntity);
                        if (index !== -1) {
                            entities.trees.splice(index, 1);
                        }

                        // Générer des RP
                        if (culture) {
                            culture.addResearchPoints(2);
                        }

                        this.state = 'idle';
                        this.targetEntity = null;
                    }
                } else {
                    this.findNearestTree(entities);
                }
                break;

            case 'searchingWater':
                // Valider que la target est toujours de l'eau
                if (this.targetX !== null && this.targetY !== null) {
                    const tx = Math.floor(this.targetX);
                    const ty = Math.floor(this.targetY);

                    if (map.grid[ty] && map.grid[ty][tx] !== map.TERRAIN_TYPES.WATER) {
                        this.targetX = null;
                        this.targetY = null;
                        this.findNearestWater(map);
                    }
                }

                if (this.targetX !== null && this.targetY !== null) {
                    if (this.moveTowards(this.targetX, this.targetY, culture)) {
                        // Commencer l'action de boire
                        this.startAction('drinking', 20); // 20 ticks pour boire

                        this.thirst -= 60;
                        this.thirst = this.clamp(this.thirst, 0, 100);

                        // Générer des RP
                        if (culture) {
                            culture.addResearchPoints(1);
                        }

                        this.state = 'idle';
                    }
                } else {
                    this.findNearestWater(map);
                }
                break;

            case 'building':
                if (this.targetX !== null && this.targetY !== null) {
                    if (this.moveTowards(this.targetX, this.targetY, culture)) {
                        // Commencer l'action de construction
                        this.startAction('building', 60); // 60 ticks pour construire

                        this.hasHouse = true;
                        this.houseX = this.targetX;
                        this.houseY = this.targetY;

                        entities.houses.push(new House(this.targetX, this.targetY, this.id));

                        this.energy -= 20;
                        this.energy = this.clamp(this.energy, 0, 100);

                        // Générer beaucoup de RP pour une construction
                        if (culture) {
                            culture.addResearchPoints(10);
                        }

                        this.state = 'idle';

                        // Logger l'événement
                        return 'building';
                    }
                }
                break;

            case 'resting':
                if (this.moveTowards(this.houseX, this.houseY, culture)) {
                    // Commencer l'action de repos
                    if (!this.currentAction) {
                        this.startAction('resting', 40); // 40 ticks pour se reposer
                    }

                    // Récupérer de l'énergie (modifié par culture)
                    const restBonus = culture ? culture.modifiers.restBonus : 1.0;
                    this.energy += 0.5 * restBonus;
                    this.energy = this.clamp(this.energy, 0, 100);

                    // Générer des RP
                    if (culture) {
                        culture.addResearchPoints(0.5);
                    }

                    // Sortir si énergie restaurée
                    if (this.energy > 80) {
                        this.state = 'idle';
                        this.currentAction = null;
                        this.actionProgress = 0;
                    }
                }
                break;
        }

        return null;
    }

    moveTowards(targetX, targetY, culture) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.5) {
            return true;
        }

        const speedBonus = culture ? culture.modifiers.speedBonus : 1.0;
        const speed = 0.3 * this.genes.speed * speedBonus;
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;

        return false;
    }

    findNearestTree(entities) {
        let nearestTree = null;
        let minDistance = Infinity;

        for (let tree of entities.trees) {
            const dx = tree.x - this.x;
            const dy = tree.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearestTree = tree;
            }
        }

        this.targetEntity = nearestTree;

        if (!nearestTree) {
            this.state = 'idle';
        }
    }

    findNearestWater(map) {
        let nearestWaterX = null;
        let nearestWaterY = null;
        let minDistance = Infinity;

        const searchRadius = 30;
        const startX = Math.max(0, Math.floor(this.x) - searchRadius);
        const endX = Math.min(map.width, Math.floor(this.x) + searchRadius);
        const startY = Math.max(0, Math.floor(this.y) - searchRadius);
        const endY = Math.min(map.height, Math.floor(this.y) + searchRadius);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (map.grid[y] && map.grid[y][x] === map.TERRAIN_TYPES.WATER) {
                    const dx = x - this.x;
                    const dy = y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestWaterX = x;
                        nearestWaterY = y;
                    }
                }
            }
        }

        this.targetX = nearestWaterX;
        this.targetY = nearestWaterY;

        if (nearestWaterX === null) {
            this.state = 'idle';
        }
    }

    findBuildingSpot(map, entities) {
        const searchRadius = 10;
        const startX = Math.max(0, Math.floor(this.x) - searchRadius);
        const endX = Math.min(map.width, Math.floor(this.x) + searchRadius);
        const startY = Math.max(0, Math.floor(this.y) - searchRadius);
        const endY = Math.min(map.height, Math.floor(this.y) + searchRadius);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (map.grid[y] && map.grid[y][x] === map.TERRAIN_TYPES.GRASS) {
                    const isFree = !entities.houses.some(h => h.x === x && h.y === y);

                    if (isFree) {
                        this.targetX = x;
                        this.targetY = y;
                        return;
                    }
                }
            }
        }

        this.state = 'idle';
    }

    tryReproduce(culture) {
        const populationCap = culture ? culture.modifiers.populationCap : 10;

        if (
            this.age > 100 &&
            this.energy > 70 &&
            this.hunger < 40 &&
            this.thirst < 40 &&
            this.reproductionCooldown <= 0
        ) {
            this.energy -= 30;
            this.energy = this.clamp(this.energy, 0, 100);
            this.reproductionCooldown = 200;

            const child = new Human(
                this.x + (Math.random() - 0.5) * 5,
                this.y + (Math.random() - 0.5) * 5,
                this.generation + 1,
                this.genes
            );

            return child;
        }

        return null;
    }

    /**
     * Dessine l'humain avec un style amélioré
     */
    draw(ctx, tileSize) {
        const centerX = this.x * tileSize;
        const centerY = this.y * tileSize;

        // Corps
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(centerX - tileSize * 0.2, centerY - tileSize * 0.1, tileSize * 0.4, tileSize * 0.6);

        // Tête
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(centerX, centerY - tileSize * 0.3, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Bras
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = tileSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(centerX - tileSize * 0.2, centerY);
        ctx.lineTo(centerX - tileSize * 0.4, centerY + tileSize * 0.2);
        ctx.moveTo(centerX + tileSize * 0.2, centerY);
        ctx.lineTo(centerX + tileSize * 0.4, centerY + tileSize * 0.2);
        ctx.stroke();

        // Jambes
        ctx.beginPath();
        ctx.moveTo(centerX - tileSize * 0.1, centerY + tileSize * 0.5);
        ctx.lineTo(centerX - tileSize * 0.2, centerY + tileSize * 0.9);
        ctx.moveTo(centerX + tileSize * 0.1, centerY + tileSize * 0.5);
        ctx.lineTo(centerX + tileSize * 0.2, centerY + tileSize * 0.9);
        ctx.stroke();

        // Indicateur d'état (couleur de la tête)
        let stateColor = '#00ff00';
        if (this.hunger > 70 || this.thirst > 70) stateColor = '#ff9800';
        if (this.energy < 30) stateColor = '#ff0000';

        ctx.fillStyle = stateColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - tileSize * 0.3, tileSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // BARRE D'ACTION au-dessus
        this.drawActionBar(ctx, centerX, centerY - tileSize * 0.7, tileSize);
    }

    /**
     * Dessine la barre d'action au-dessus de l'humain
     */
    drawActionBar(ctx, x, y, tileSize) {
        if (!this.currentAction || this.actionProgress === 0) return;

        const barWidth = tileSize * 0.8;
        const barHeight = tileSize * 0.1;

        // Couleur selon l'action
        let barColor = '#00bcd4'; // Cyan par défaut
        if (this.currentAction === 'drinking') barColor = '#2196F3'; // Bleu
        if (this.currentAction === 'eating') barColor = '#4CAF50'; // Vert
        if (this.currentAction === 'building') barColor = '#FF9800'; // Orange
        if (this.currentAction === 'resting') barColor = '#9C27B0'; // Violet

        // Fond de la barre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        // Progression
        ctx.fillStyle = barColor;
        ctx.fillRect(x - barWidth / 2, y, barWidth * this.actionProgress, barHeight);

        // Bordure
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    }
}

/**
 * Gestionnaire d'entités (VERSION AMÉLIORÉE)
 */
class EntityManager {
    constructor(map) {
        this.map = map;
        this.trees = [];
        this.rocks = [];
        this.houses = [];
        this.humans = [];

        this.totalBirths = 0;
        this.totalDeaths = 0;
        this.lastPopulation = 0;
    }

    /**
     * HELPER : Trouve une tuile de terre aléatoire (PAS D'EAU)
     */
    getRandomLandTile() {
        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.map.width);
            const y = Math.floor(Math.random() * this.map.height);

            const terrainType = this.map.grid[y][x];

            // Accepter seulement plaines ou sable (PAS d'eau ou de roche)
            if (terrainType === this.map.TERRAIN_TYPES.GRASS ||
                terrainType === this.map.TERRAIN_TYPES.SAND) {
                return { x, y };
            }

            attempts++;
        }

        // Fallback : retourner le centre de la carte
        console.warn('⚠️ Impossible de trouver une tuile de terre, utilisation du centre');
        return { x: Math.floor(this.map.width / 2), y: Math.floor(this.map.height / 2) };
    }

    initialize() {
        console.log('🌱 Initialisation de la vie...');

        this.spawnTrees(150);
        this.spawnRocks(50);
        this.spawnInitialHumans(5);

        console.log(`✅ Monde initialisé: ${this.trees.length} arbres, ${this.rocks.length} rochers, ${this.humans.length} humains`);
    }

    spawnTrees(count) {
        let spawned = 0;
        let attempts = 0;
        const maxAttempts = count * 10;

        while (spawned < count && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.map.width);
            const y = Math.floor(Math.random() * this.map.height);

            if (this.map.grid[y][x] === this.map.TERRAIN_TYPES.GRASS) {
                this.trees.push(new Tree(x, y));
                spawned++;
            }

            attempts++;
        }
    }

    spawnRocks(count) {
        let spawned = 0;
        let attempts = 0;
        const maxAttempts = count * 10;

        while (spawned < count && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.map.width);
            const y = Math.floor(Math.random() * this.map.height);

            if (this.map.grid[y][x] === this.map.TERRAIN_TYPES.ROCK) {
                this.rocks.push(new Rock(x, y));
                spawned++;
            }

            attempts++;
        }
    }

    spawnInitialHumans(count) {
        for (let i = 0; i < count; i++) {
            const tile = this.getRandomLandTile();
            this.humans.push(new Human(tile.x, tile.y));
            this.totalBirths++;
        }
    }

    regrowTrees(culture) {
        const regrowthRate = culture ? culture.modifiers.treeRegrowthRate : 1.0;
        const chance = 0.1 * regrowthRate;

        if (Math.random() < chance && this.trees.length < 200) {
            const tile = this.getRandomLandTile();
            if (this.map.grid[tile.y][tile.x] === this.map.TERRAIN_TYPES.GRASS) {
                this.trees.push(new Tree(tile.x, tile.y));
            }
        }
    }

    update(culture, eventLog, currentYear) {
        this.regrowTrees(culture);

        // Mettre à jour la culture
        if (culture) {
            culture.update();
        }

        const newHumans = [];
        const populationCap = culture ? culture.modifiers.populationCap : 10;

        for (let human of this.humans) {
            const alive = human.update(this.map, this, culture);

            if (alive) {
                newHumans.push(human);

                // Tenter la reproduction (seulement si sous la limite)
                if (newHumans.length < populationCap) {
                    const child = human.tryReproduce(culture);
                    if (child) {
                        // S'assurer que l'enfant spawn sur terre
                        const landTile = this.getRandomLandTile();
                        child.x = landTile.x;
                        child.y = landTile.y;

                        newHumans.push(child);
                        this.totalBirths++;

                        if (eventLog) {
                            eventLog.logBirth(child.generation);
                        }
                    }
                }
            } else {
                this.totalDeaths++;
                if (eventLog) {
                    eventLog.logDeath(Math.floor(human.age), human.generation);
                }
            }
        }

        this.humans = newHumans;

        // Logger les jalons de population
        if (eventLog && this.humans.length !== this.lastPopulation) {
            if (this.humans.length > 0 && this.humans.length % 10 === 0 && this.humans.length > this.lastPopulation) {
                eventLog.logPopulationMilestone(this.humans.length);
            }
            this.lastPopulation = this.humans.length;
        }
    }

    draw(ctx, tileSize) {
        for (let rock of this.rocks) {
            rock.draw(ctx, tileSize);
        }

        for (let tree of this.trees) {
            tree.draw(ctx, tileSize);
        }

        for (let house of this.houses) {
            house.draw(ctx, tileSize);
        }

        for (let human of this.humans) {
            human.draw(ctx, tileSize);
        }
    }

    getPopulation() {
        return this.humans.length;
    }
}
