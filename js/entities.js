/**
 * ===================================
 * ENTITIES.JS - Système de vie et évolution
 * ===================================
 *
 * Ce module gère :
 * - Les entités naturelles (arbres, rochers)
 * - Les humains avec IA et besoins
 * - La reproduction et l'évolution génétique
 * - Les constructions (maisons)
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
 */
class Tree extends Entity {
    constructor(x, y) {
        super(x, y, 'tree');
        this.food = 50; // Quantité de nourriture fournie
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(
            this.x * tileSize + tileSize / 2,
            this.y * tileSize + tileSize / 2,
            tileSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

/**
 * Rocher - Élément décoratif sur les montagnes
 */
class Rock extends Entity {
    constructor(x, y) {
        super(x, y, 'rock');
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#555555';
        ctx.fillRect(
            this.x * tileSize,
            this.y * tileSize,
            tileSize,
            tileSize
        );
    }
}

/**
 * Maison - Abri construit par les humains
 */
class House extends Entity {
    constructor(x, y, ownerId) {
        super(x, y, 'house');
        this.ownerId = ownerId;
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(
            this.x * tileSize,
            this.y * tileSize,
            tileSize,
            tileSize
        );

        // Toit
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(this.x * tileSize, this.y * tileSize);
        ctx.lineTo((this.x + 0.5) * tileSize, (this.y - 0.3) * tileSize);
        ctx.lineTo((this.x + 1) * tileSize, this.y * tileSize);
        ctx.fill();
    }
}

/**
 * Humain - Entité autonome avec IA et évolution
 */
class Human extends Entity {
    constructor(x, y, generation = 0, genes = null) {
        super(x, y, 'human');

        // ID unique
        this.id = Math.random().toString(36).substr(2, 9);

        // Besoins (0-100)
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

        // Gènes (peuvent muter)
        if (genes) {
            this.genes = { ...genes };
            this.mutateGenes();
        } else {
            this.genes = {
                speed: 1.0,           // Vitesse de déplacement
                efficiency: 1.0,      // Efficacité de collecte
                metabolism: 1.0       // Vitesse de consommation d'énergie
            };
        }

        // État comportemental
        this.state = 'idle';
        this.targetX = null;
        this.targetY = null;
        this.targetEntity = null;
    }

    /**
     * Applique des mutations génétiques aléatoires
     */
    mutateGenes() {
        const mutationRate = 0.1; // ±10%

        for (let gene in this.genes) {
            const mutation = (Math.random() - 0.5) * 2 * mutationRate;
            this.genes[gene] *= (1 + mutation);

            // Limiter les valeurs extrêmes
            this.genes[gene] = Math.max(0.5, Math.min(2.0, this.genes[gene]));
        }
    }

    /**
     * Met à jour l'état et les besoins de l'humain
     */
    update(map, entities) {
        // Vieillir
        this.age += 0.01;

        // Diminuer le cooldown de reproduction
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown -= 0.1;
        }

        // Consommer de l'énergie (influencé par le métabolisme)
        this.energy -= 0.05 * this.genes.metabolism;

        // Augmenter la faim et la soif
        this.hunger += 0.08;
        this.thirst += 0.06;

        // Limiter les valeurs
        this.energy = Math.max(0, Math.min(100, this.energy));
        this.hunger = Math.max(0, Math.min(100, this.hunger));
        this.thirst = Math.max(0, Math.min(100, this.thirst));

        // Vérifier la mort
        if (this.energy <= 0 || this.hunger >= 100 || this.thirst >= 100) {
            return false; // Mort
        }

        // Prendre des décisions basées sur les besoins
        this.decideBehavior(map, entities);

        // Exécuter le comportement actuel
        this.executeBehavior(map, entities);

        return true; // Vivant
    }

    /**
     * Décide du comportement en fonction des besoins
     */
    decideBehavior(map, entities) {
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
        // Priorité 3: Énergie basse et a une maison
        else if (this.energy < 40 && this.hasHouse && this.state !== 'resting') {
            this.state = 'resting';
            this.targetX = this.houseX;
            this.targetY = this.houseY;
        }
        // Priorité 4: Construire une maison si stable et n'en a pas
        else if (!this.hasHouse && this.hunger < 50 && this.thirst < 50 && this.energy > 60) {
            if (this.state !== 'building') {
                this.state = 'building';
                this.findBuildingSpot(map, entities);
            }
        }
        // Sinon: Surveiller les besoins
        else if (this.state === 'idle') {
            // Recherche proactive de nourriture
            if (this.hunger > 40) {
                this.state = 'searchingFood';
                this.findNearestTree(entities);
            }
            // Recherche proactive d'eau
            else if (this.thirst > 40) {
                this.state = 'searchingWater';
                this.findNearestWater(map);
            }
        }
    }

    /**
     * Exécute le comportement actuel
     */
    executeBehavior(map, entities) {
        switch (this.state) {
            case 'searchingFood':
                if (this.targetEntity && this.targetEntity.type === 'tree') {
                    if (this.moveTowards(this.targetEntity.x, this.targetEntity.y)) {
                        // Arrivé à l'arbre, manger
                        this.hunger -= 50 * this.genes.efficiency;
                        this.energy += 20 * this.genes.efficiency;
                        this.hunger = Math.max(0, this.hunger);

                        // Supprimer l'arbre
                        const index = entities.trees.indexOf(this.targetEntity);
                        if (index !== -1) {
                            entities.trees.splice(index, 1);
                        }

                        this.state = 'idle';
                        this.targetEntity = null;
                    }
                } else {
                    this.findNearestTree(entities);
                }
                break;

            case 'searchingWater':
                if (this.targetX !== null && this.targetY !== null) {
                    if (this.moveTowards(this.targetX, this.targetY)) {
                        // Arrivé à l'eau, boire
                        this.thirst -= 60;
                        this.thirst = Math.max(0, this.thirst);
                        this.state = 'idle';
                    }
                } else {
                    this.findNearestWater(map);
                }
                break;

            case 'building':
                if (this.targetX !== null && this.targetY !== null) {
                    if (this.moveTowards(this.targetX, this.targetY)) {
                        // Construire la maison
                        this.hasHouse = true;
                        this.houseX = this.targetX;
                        this.houseY = this.targetY;

                        entities.houses.push(new House(this.targetX, this.targetY, this.id));

                        this.energy -= 20; // Coût de construction
                        this.state = 'idle';
                    }
                }
                break;

            case 'resting':
                if (this.moveTowards(this.houseX, this.houseY)) {
                    // Dans la maison, récupérer de l'énergie
                    this.energy += 0.5;
                    this.energy = Math.min(100, this.energy);

                    // Sortir si énergie restaurée
                    if (this.energy > 80) {
                        this.state = 'idle';
                    }
                }
                break;
        }
    }

    /**
     * Déplace l'humain vers une cible
     * Retourne true si arrivé à destination
     */
    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Arrivé à destination
        if (distance < 0.5) {
            return true;
        }

        // Se déplacer vers la cible
        const speed = 0.3 * this.genes.speed;
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;

        return false;
    }

    /**
     * Trouve l'arbre le plus proche
     */
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
            this.state = 'idle'; // Pas d'arbre disponible
        }
    }

    /**
     * Trouve l'eau la plus proche
     */
    findNearestWater(map) {
        let nearestWaterX = null;
        let nearestWaterY = null;
        let minDistance = Infinity;

        // Chercher dans un rayon autour de l'humain
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
            this.state = 'idle'; // Pas d'eau à proximité
        }
    }

    /**
     * Trouve un emplacement pour construire une maison
     */
    findBuildingSpot(map, entities) {
        // Chercher une plaine proche et libre
        const searchRadius = 10;
        const startX = Math.max(0, Math.floor(this.x) - searchRadius);
        const endX = Math.min(map.width, Math.floor(this.x) + searchRadius);
        const startY = Math.max(0, Math.floor(this.y) - searchRadius);
        const endY = Math.min(map.height, Math.floor(this.y) + searchRadius);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (map.grid[y] && map.grid[y][x] === map.TERRAIN_TYPES.GRASS) {
                    // Vérifier si l'emplacement est libre
                    const isFree = !entities.houses.some(h => h.x === x && h.y === y);

                    if (isFree) {
                        this.targetX = x;
                        this.targetY = y;
                        return;
                    }
                }
            }
        }

        // Aucun emplacement trouvé
        this.state = 'idle';
    }

    /**
     * Tente de se reproduire si les conditions sont bonnes
     */
    tryReproduce() {
        // Conditions de reproduction
        if (
            this.age > 100 &&
            this.energy > 70 &&
            this.hunger < 40 &&
            this.thirst < 40 &&
            this.reproductionCooldown <= 0
        ) {
            // Coût énergétique
            this.energy -= 30;
            this.reproductionCooldown = 200; // Cooldown entre reproductions

            // Créer un enfant avec gènes hérités
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
     * Dessine l'humain sur le canvas
     */
    draw(ctx, tileSize) {
        // Corps
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(
            this.x * tileSize,
            this.y * tileSize,
            tileSize * 0.6,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Indicateur d'état (couleur)
        let stateColor = '#00ff00'; // Vert = en bonne santé
        if (this.hunger > 70 || this.thirst > 70) stateColor = '#ff9800'; // Orange = besoin
        if (this.energy < 30) stateColor = '#ff0000'; // Rouge = critique

        ctx.fillStyle = stateColor;
        ctx.beginPath();
        ctx.arc(
            this.x * tileSize,
            this.y * tileSize,
            tileSize * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

/**
 * Gestionnaire d'entités
 */
class EntityManager {
    constructor(map) {
        this.map = map;
        this.trees = [];
        this.rocks = [];
        this.houses = [];
        this.humans = [];

        // Statistiques
        this.totalBirths = 0;
        this.totalDeaths = 0;
    }

    /**
     * Initialise le monde avec des entités
     */
    initialize() {
        console.log('🌱 Initialisation de la vie...');

        // Générer des arbres sur les plaines
        this.spawnTrees(150);

        // Générer des rochers sur les montagnes
        this.spawnRocks(50);

        // Créer quelques humains initiaux
        this.spawnInitialHumans(5);

        console.log(`✅ Monde initialisé: ${this.trees.length} arbres, ${this.rocks.length} rochers, ${this.humans.length} humains`);
    }

    /**
     * Génère des arbres aléatoirement sur les plaines
     */
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

    /**
     * Génère des rochers aléatoirement sur les montagnes
     */
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

    /**
     * Crée les humains initiaux
     */
    spawnInitialHumans(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;

            // Trouver une plaine pour spawn
            do {
                x = Math.floor(Math.random() * this.map.width);
                y = Math.floor(Math.random() * this.map.height);
                attempts++;
            } while (
                attempts < 100 &&
                this.map.grid[y][x] !== this.map.TERRAIN_TYPES.GRASS
            );

            this.humans.push(new Human(x, y));
            this.totalBirths++;
        }
    }

    /**
     * Fait repousser des arbres aléatoirement
     */
    regrowTrees() {
        // Petit taux de repousse (1 arbre toutes les 10 frames environ)
        if (Math.random() < 0.1 && this.trees.length < 200) {
            const x = Math.floor(Math.random() * this.map.width);
            const y = Math.floor(Math.random() * this.map.height);

            if (this.map.grid[y][x] === this.map.TERRAIN_TYPES.GRASS) {
                this.trees.push(new Tree(x, y));
            }
        }
    }

    /**
     * Met à jour toutes les entités
     */
    update() {
        // Repousse des arbres
        this.regrowTrees();

        // Mettre à jour les humains
        const newHumans = [];

        for (let human of this.humans) {
            const alive = human.update(this.map, this);

            if (alive) {
                newHumans.push(human);

                // Tenter la reproduction
                const child = human.tryReproduce();
                if (child) {
                    newHumans.push(child);
                    this.totalBirths++;
                    console.log(`👶 Naissance ! Génération ${child.generation}, Population: ${newHumans.length}`);
                }
            } else {
                this.totalDeaths++;
                console.log(`💀 Décès à l'âge ${Math.floor(human.age)}, Génération ${human.generation}`);
            }
        }

        this.humans = newHumans;
    }

    /**
     * Dessine toutes les entités
     */
    draw(ctx, tileSize) {
        // Dessiner les rochers
        for (let rock of this.rocks) {
            rock.draw(ctx, tileSize);
        }

        // Dessiner les arbres
        for (let tree of this.trees) {
            tree.draw(ctx, tileSize);
        }

        // Dessiner les maisons
        for (let house of this.houses) {
            house.draw(ctx, tileSize);
        }

        // Dessiner les humains
        for (let human of this.humans) {
            human.draw(ctx, tileSize);
        }
    }

    /**
     * Retourne le nombre d'humains vivants
     */
    getPopulation() {
        return this.humans.length;
    }
}
