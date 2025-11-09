/**
 * ===================================
 * BUILDINGS.JS - Système de bâtiments et infrastructures
 * ===================================
 *
 * Ce module gère :
 * - Différents types de bâtiments (mines, fermes, ports, etc.)
 * - Construction et évolution des bâtiments
 * - Production de ressources
 * - Routes automatiques entre bâtiments
 */

/**
 * Classe de base pour tous les bâtiments
 */
class Building {
    constructor(x, y, type, villageId = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.villageId = villageId;
        this.level = 1;
        this.constructionProgress = 0;
        this.maxConstructionTime = 100;
        this.isBuilt = false;
        this.workers = 0;
        this.maxWorkers = 2;
        this.productionTimer = 0;
        this.productionCooldown = 100; // ticks entre productions
    }

    /**
     * Met à jour le bâtiment
     */
    update(culture) {
        // Construction en cours
        if (!this.isBuilt) {
            if (this.workers > 0) {
                const buildSpeed = this.workers * (culture ? culture.modifiers.speedBonus : 1.0);
                this.constructionProgress += buildSpeed;

                if (this.constructionProgress >= this.maxConstructionTime) {
                    this.isBuilt = true;
                    return { type: 'buildingComplete', building: this };
                }
            }
            return null;
        }

        // Production
        if (this.workers > 0) {
            this.productionTimer++;

            if (this.productionTimer >= this.productionCooldown) {
                this.productionTimer = 0;
                return this.produce(culture);
            }
        }

        return null;
    }

    /**
     * Production du bâtiment (à override)
     */
    produce(culture) {
        return null;
    }

    /**
     * Dessine le bâtiment
     */
    draw(ctx, tileSize) {
        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        // Barre de construction si non terminé
        if (!this.isBuilt) {
            const progress = this.constructionProgress / this.maxConstructionTime;

            // Fond de la barre
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x - tileSize * 0.5, y - tileSize * 0.7, tileSize, tileSize * 0.15);

            // Progression
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(x - tileSize * 0.5, y - tileSize * 0.7, tileSize * progress, tileSize * 0.15);
        }
    }
}

/**
 * Mine - Extrait pierre, fer ou or
 */
class Mine extends Building {
    constructor(x, y, mineType = 'iron', villageId = null) {
        super(x, y, 'mine', villageId);
        this.mineType = mineType; // 'iron', 'gold', 'stone'
        this.resourcesLeft = 200 + Math.random() * 300;
        this.maxWorkers = 3;
        this.productionCooldown = 50;
    }

    produce(culture) {
        if (this.resourcesLeft <= 0) return null;

        const amount = this.workers * 2 * (culture ? culture.modifiers.gatheringBonus : 1.0);
        const extracted = Math.min(amount, this.resourcesLeft);
        this.resourcesLeft -= extracted;

        return {
            type: 'production',
            building: this,
            resource: this.mineType,
            amount: extracted
        };
    }

    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);

        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        if (!this.isBuilt) return;

        // Dessin de la mine
        // Entrée de la mine (carré gris foncé)
        ctx.fillStyle = '#424242';
        ctx.fillRect(x - tileSize * 0.4, y - tileSize * 0.4, tileSize * 0.8, tileSize * 0.8);

        // Bordure
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - tileSize * 0.4, y - tileSize * 0.4, tileSize * 0.8, tileSize * 0.8);

        // Icône selon le type
        ctx.fillStyle = this.mineType === 'gold' ? '#FFD700' : (this.mineType === 'iron' ? '#B0BEC5' : '#9E9E9E');
        ctx.font = `${tileSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛏', x, y);
    }
}

/**
 * Ferme - Produit de la nourriture
 */
class Farm extends Building {
    constructor(x, y, villageId = null) {
        super(x, y, 'farm', villageId);
        this.maxWorkers = 2;
        this.productionCooldown = 60;
    }

    produce(culture) {
        const amount = this.workers * 5 * (culture ? culture.modifiers.foodEfficiency : 1.0);

        return {
            type: 'production',
            building: this,
            resource: 'food',
            amount: amount
        };
    }

    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);

        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        if (!this.isBuilt) return;

        // Champs (rectangles verts)
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(x - tileSize * 0.5, y - tileSize * 0.5, tileSize * 0.45, tileSize * 0.45);
        ctx.fillStyle = '#9CCC65';
        ctx.fillRect(x + tileSize * 0.05, y - tileSize * 0.5, tileSize * 0.45, tileSize * 0.45);
        ctx.fillStyle = '#AED581';
        ctx.fillRect(x - tileSize * 0.5, y + tileSize * 0.05, tileSize * 0.45, tileSize * 0.45);
        ctx.fillRect(x + tileSize * 0.05, y + tileSize * 0.05, tileSize * 0.45, tileSize * 0.45);

        // Bordures
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - tileSize * 0.5, y - tileSize * 0.5, tileSize, tileSize);
    }
}

/**
 * Port - Permet la navigation
 */
class Port extends Building {
    constructor(x, y, villageId = null) {
        super(x, y, 'port', villageId);
        this.maxWorkers = 1;
        this.boats = [];
        this.maxBoats = 3;
    }

    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);

        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        if (!this.isBuilt) return;

        // Quai (marron)
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - tileSize * 0.5, y - tileSize * 0.3, tileSize, tileSize * 0.6);

        // Bordure
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - tileSize * 0.5, y - tileSize * 0.3, tileSize, tileSize * 0.6);

        // Ancre
        ctx.fillStyle = '#263238';
        ctx.font = `${tileSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚓', x, y);
    }
}

/**
 * Atelier / Forge - Produit des outils
 */
class Workshop extends Building {
    constructor(x, y, villageId = null) {
        super(x, y, 'workshop', villageId);
        this.maxWorkers = 2;
        this.productionCooldown = 80;
    }

    produce(culture) {
        return {
            type: 'production',
            building: this,
            resource: 'tools',
            amount: this.workers
        };
    }

    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);

        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        if (!this.isBuilt) return;

        // Bâtiment (gris)
        ctx.fillStyle = '#607D8B';
        ctx.fillRect(x - tileSize * 0.45, y - tileSize * 0.35, tileSize * 0.9, tileSize * 0.7);

        // Toit (gris foncé)
        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.moveTo(x, y - tileSize * 0.5);
        ctx.lineTo(x + tileSize * 0.5, y - tileSize * 0.35);
        ctx.lineTo(x + tileSize * 0.5, y - tileSize * 0.3);
        ctx.lineTo(x - tileSize * 0.5, y - tileSize * 0.3);
        ctx.lineTo(x - tileSize * 0.5, y - tileSize * 0.35);
        ctx.closePath();
        ctx.fill();

        // Enclume
        ctx.fillStyle = '#263238';
        ctx.font = `${tileSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔨', x, y);
    }
}

/**
 * Marché - Échange de ressources
 */
class Market extends Building {
    constructor(x, y, villageId = null) {
        super(x, y, 'market', villageId);
        this.maxWorkers = 2;
        this.inventory = {
            wood: 0,
            stone: 0,
            iron: 0,
            gold: 0,
            food: 0
        };
    }

    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);

        const x = this.x * tileSize + tileSize / 2;
        const y = this.y * tileSize + tileSize / 2;

        if (!this.isBuilt) return;

        // Toit (rouge)
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.moveTo(x, y - tileSize * 0.6);
        ctx.lineTo(x + tileSize * 0.6, y - tileSize * 0.2);
        ctx.lineTo(x, y + tileSize * 0.2);
        ctx.lineTo(x - tileSize * 0.6, y - tileSize * 0.2);
        ctx.closePath();
        ctx.fill();

        // Base (beige)
        ctx.fillStyle = '#FFF8E1';
        ctx.fillRect(x - tileSize * 0.4, y - tileSize * 0.2, tileSize * 0.8, tileSize * 0.6);

        // Symbole
        ctx.fillStyle = '#F57C00';
        ctx.font = `${tileSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏛️', x, y + tileSize * 0.1);
    }
}

/**
 * Route - Connexion entre bâtiments
 */
class Road {
    constructor(fromX, fromY, toX, toY) {
        this.from = { x: fromX, y: fromY };
        this.to = { x: toX, y: toY };
        this.level = 1; // 1 = chemin, 2 = route, 3 = route pavée
        this.usage = 0; // Nombre de passages
    }

    draw(ctx, tileSize) {
        const color = this.level === 1 ? '#8D6E63' : (this.level === 2 ? '#6D4C41' : '#5D4037');
        const width = this.level * 1.5;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.from.x * tileSize + tileSize / 2, this.from.y * tileSize + tileSize / 2);
        ctx.lineTo(this.to.x * tileSize + tileSize / 2, this.to.y * tileSize + tileSize / 2);
        ctx.stroke();
    }

    /**
     * Augmente le niveau de la route si beaucoup utilisée
     */
    upgrade() {
        if (this.usage > 100 && this.level === 1) {
            this.level = 2;
            this.usage = 0;
        } else if (this.usage > 200 && this.level === 2) {
            this.level = 3;
            this.usage = 0;
        }
    }
}

/**
 * Gestionnaire de bâtiments
 */
class BuildingManager {
    constructor() {
        this.buildings = [];
        this.roads = [];
    }

    /**
     * Ajoute un bâtiment
     */
    addBuilding(building) {
        this.buildings.push(building);
        this.updateRoadNetwork();
        return building;
    }

    /**
     * Supprime un bâtiment
     */
    removeBuilding(building) {
        const index = this.buildings.indexOf(building);
        if (index > -1) {
            this.buildings.splice(index, 1);
            this.updateRoadNetwork();
        }
    }

    /**
     * Met à jour le réseau de routes
     */
    updateRoadNetwork() {
        // Connecter automatiquement les bâtiments proches
        const maxDistance = 15;

        for (let i = 0; i < this.buildings.length; i++) {
            for (let j = i + 1; j < this.buildings.length; j++) {
                const b1 = this.buildings[i];
                const b2 = this.buildings[j];

                if (!b1.isBuilt || !b2.isBuilt) continue;

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= maxDistance) {
                    // Vérifier si la route existe déjà
                    const exists = this.roads.some(road =>
                        (road.from.x === b1.x && road.from.y === b1.y && road.to.x === b2.x && road.to.y === b2.y) ||
                        (road.from.x === b2.x && road.from.y === b2.y && road.to.x === b1.x && road.to.y === b1.y)
                    );

                    if (!exists) {
                        this.roads.push(new Road(b1.x, b1.y, b2.x, b2.y));
                    }
                }
            }
        }
    }

    /**
     * Trouve un bâtiment à une position
     */
    getBuildingAt(x, y) {
        return this.buildings.find(b => b.x === x && b.y === y);
    }

    /**
     * Trouve les bâtiments d'un type
     */
    getBuildingsByType(type) {
        return this.buildings.filter(b => b.type === type && b.isBuilt);
    }

    /**
     * Met à jour tous les bâtiments
     */
    update(culture, eventLog) {
        const events = [];

        this.buildings.forEach(building => {
            const event = building.update(culture);
            if (event) {
                events.push(event);

                if (event.type === 'buildingComplete' && eventLog) {
                    eventLog.log('building', `Construction terminée : ${building.type}`);
                }

                if (event.type === 'production' && event.amount > 0) {
                    // Stocker la production quelque part (village, marché, etc.)
                }
            }
        });

        // Mise à jour des routes
        this.roads.forEach(road => road.upgrade());

        return events;
    }

    /**
     * Dessine tous les bâtiments et routes
     */
    draw(ctx, tileSize) {
        // Dessiner d'abord les routes
        this.roads.forEach(road => road.draw(ctx, tileSize));

        // Dessiner ensuite les bâtiments
        this.buildings.forEach(building => building.draw(ctx, tileSize));
    }
}
