/**
 * ===================================
 * CULTURE.JS - Système de recherche et évolution culturelle ÉTENDU
 * ===================================
 *
 * Ce module gère :
 * - L'accumulation de points de recherche (RP)
 * - L'arbre technologique complet (8 âges)
 * - La progression de recherche automatique
 * - Les effets des technologies sur la simulation
 */

class Culture {
    constructor() {
        // Points de recherche accumulés
        this.researchPoints = 0;

        // Recherche actuelle
        this.currentResearchId = null;
        this.progress = 0;

        // Technologies débloquées
        this.unlockedTechs = [];

        // Âge actuel (1-8)
        this.currentAge = 1;

        // Définition complète de l'arbre technologique (8 âges)
        this.techTree = this.buildTechTree();

        // Multiplicateurs globaux
        this.modifiers = {
            rpMultiplier: 1.0,
            gatheringBonus: 1.0,
            restBonus: 1.0,
            treeRegrowthRate: 1.0,
            populationCap: 10,
            foodEfficiency: 1.0,
            thirstReduction: 1.0,
            speedBonus: 1.0,
            lifespanBonus: 1.0,
            buildSpeed: 1.0,
            miningBonus: 1.0,
            tradingBonus: 1.0,
            navigationBonus: 1.0
        };

        // Commencer la première recherche
        this.startNextResearch();
    }

    /**
     * Construit l'arbre technologique complet
     */
    buildTechTree() {
        return {
            // ===============================
            // ÂGE 1 - PRÉHISTOIRE
            // ===============================
            observation: {
                id: 'observation',
                name: 'Observation',
                age: 1,
                icon: '👁️',
                description: 'Les humains observent leur environnement et apprennent.',
                cost: 50,
                prerequisites: [],
                effects: { rpMultiplier: 1.3 }
            },

            fire: {
                id: 'fire',
                name: 'Maîtrise du Feu',
                age: 1,
                icon: '🔥',
                description: 'Découverte et maîtrise du feu pour se chauffer et cuisiner.',
                cost: 100,
                prerequisites: ['observation'],
                effects: { restBonus: 1.3, foodEfficiency: 1.2 }
            },

            basicTools: {
                id: 'basicTools',
                name: 'Outils Rudimentaires',
                age: 1,
                icon: '🪨',
                description: 'Outils simples en pierre pour la chasse et la cueillette.',
                cost: 150,
                prerequisites: ['observation'],
                effects: { gatheringBonus: 1.3 }
            },

            hunting: {
                id: 'hunting',
                name: 'Chasse et Cueillette',
                age: 1,
                icon: '🏹',
                description: 'Techniques de chasse organisée.',
                cost: 200,
                prerequisites: ['basicTools', 'fire'],
                effects: { foodEfficiency: 1.4 }
            },

            // ===============================
            // ÂGE 2 - NÉOLITHIQUE
            // ===============================
            agriculture: {
                id: 'agriculture',
                name: 'Agriculture',
                age: 2,
                icon: '🌾',
                description: 'Culture de plantes. Les ressources se régénèrent plus vite.',
                cost: 400,
                prerequisites: ['hunting'],
                effects: { treeRegrowthRate: 2.0, foodEfficiency: 1.5 }
            },

            animalHusbandry: {
                id: 'animalHusbandry',
                name: 'Élevage',
                age: 2,
                icon: '🐄',
                description: 'Domestication des animaux pour nourriture et travail.',
                cost: 450,
                prerequisites: ['hunting'],
                effects: { foodEfficiency: 1.6, speedBonus: 1.1 }
            },

            improvedShelter: {
                id: 'improvedShelter',
                name: 'Abris Améliorés',
                age: 2,
                icon: '🏠',
                description: 'Constructions plus solides et confortables.',
                cost: 350,
                prerequisites: ['basicTools'],
                effects: { restBonus: 1.5, buildSpeed: 1.2 }
            },

            pottery: {
                id: 'pottery',
                name: 'Poterie',
                age: 2,
                icon: '🏺',
                description: 'Création de récipients pour stocker nourriture et eau.',
                cost: 300,
                prerequisites: ['fire'],
                effects: { thirstReduction: 0.8 }
            },

            weaving: {
                id: 'weaving',
                name: 'Tissage',
                age: 2,
                icon: '🧵',
                description: 'Fabrication de vêtements et tissus.',
                cost: 350,
                prerequisites: ['basicTools'],
                effects: { lifespanBonus: 1.1 }
            },

            // ===============================
            // ÂGE 3 - ÂGE DU BRONZE
            // ===============================
            metallurgy: {
                id: 'metallurgy',
                name: 'Métallurgie',
                age: 3,
                icon: '🔩',
                description: 'Travail du bronze. Outils et armes en métal.',
                cost: 600,
                prerequisites: ['pottery', 'improvedShelter'],
                effects: { gatheringBonus: 1.6, miningBonus: 1.5 }
            },

            roads: {
                id: 'roads',
                name: 'Routes',
                age: 3,
                icon: '🛣️',
                description: 'Chemins reliant les villages.',
                cost: 500,
                prerequisites: ['improvedShelter'],
                effects: { speedBonus: 1.3 }
            },

            localTrade: {
                id: 'localTrade',
                name: 'Commerce Local',
                age: 3,
                icon: '💰',
                description: 'Échanges de ressources entre villages.',
                cost: 550,
                prerequisites: ['roads'],
                effects: { tradingBonus: 1.3, populationCap: 15 }
            },

            navigation: {
                id: 'navigation',
                name: 'Navigation',
                age: 3,
                icon: '⛵',
                description: 'Construction de bateaux simples.',
                cost: 700,
                prerequisites: ['weaving'],
                unlocks: ['port'],
                effects: { navigationBonus: 1.5 }
            },

            socialOrganization: {
                id: 'socialOrganization',
                name: 'Organisation Sociale',
                age: 3,
                icon: '👥',
                description: 'Hiérarchie et rôles définis.',
                cost: 600,
                prerequisites: ['agriculture', 'animalHusbandry'],
                effects: { populationCap: 20, buildSpeed: 1.3 }
            },

            // ===============================
            // ÂGE 4 - ÂGE DU FER
            // ===============================
            ironWorking: {
                id: 'ironWorking',
                name: 'Travail du Fer',
                age: 4,
                icon: '⚔️',
                description: 'Forgeage du fer. Outils et armes supérieurs.',
                cost: 900,
                prerequisites: ['metallurgy'],
                effects: { gatheringBonus: 2.0, miningBonus: 2.0, speedBonus: 1.2 }
            },

            architecture: {
                id: 'architecture',
                name: 'Architecture',
                age: 4,
                icon: '🏛️',
                description: 'Constructions monumentales et durables.',
                cost: 800,
                prerequisites: ['metallurgy', 'socialOrganization'],
                unlocks: ['market', 'workshop'],
                effects: { buildSpeed: 1.5, populationCap: 30 }
            },

            writing: {
                id: 'writing',
                name: 'Écriture',
                age: 4,
                icon: '📜',
                description: 'Système d\'écriture pour transmettre le savoir.',
                cost: 1000,
                prerequisites: ['socialOrganization'],
                effects: { rpMultiplier: 2.0 }
            },

            religion: {
                id: 'religion',
                name: 'Religion',
                age: 4,
                icon: '⛪',
                description: 'Croyances organisées et temples.',
                cost: 850,
                prerequisites: ['socialOrganization'],
                effects: { populationCap: 35, lifespanBonus: 1.2 }
            },

            lawAndOrder: {
                id: 'lawAndOrder',
                name: 'Lois et Ordre',
                age: 4,
                icon: '⚖️',
                description: 'Code de lois pour la société.',
                cost: 950,
                prerequisites: ['writing', 'religion'],
                effects: { populationCap: 40 }
            },

            // ===============================
            // ÂGE 5 - CLASSIQUE
            // ===============================
            philosophy: {
                id: 'philosophy',
                name: 'Philosophie',
                age: 5,
                icon: '🎓',
                description: 'Réflexion sur le monde et l\'existence.',
                cost: 1200,
                prerequisites: ['writing'],
                effects: { rpMultiplier: 2.5 }
            },

            marketplaces: {
                id: 'marketplaces',
                name: 'Marchés',
                age: 5,
                icon: '🏛️',
                description: 'Places de commerce centralisées.',
                cost: 1100,
                prerequisites: ['architecture', 'localTrade'],
                unlocks: ['market'],
                effects: { tradingBonus: 2.0, populationCap: 50 }
            },

            arts: {
                id: 'arts',
                name: 'Arts',
                age: 5,
                icon: '🎨',
                description: 'Peinture, sculpture et musique.',
                cost: 1000,
                prerequisites: ['philosophy'],
                effects: { rpMultiplier: 1.5 }
            },

            economy: {
                id: 'economy',
                name: 'Économie',
                age: 5,
                icon: '💳',
                description: 'Système monétaire et économique.',
                cost: 1300,
                prerequisites: ['marketplaces'],
                effects: { tradingBonus: 2.5 }
            },

            diplomacy: {
                id: 'diplomacy',
                name: 'Diplomatie',
                age: 5,
                icon: '🤝',
                description: 'Relations pacifiques entre civilisations.',
                cost: 1150,
                prerequisites: ['lawAndOrder', 'philosophy'],
                effects: { populationCap: 60 }
            },

            advancedNavigation: {
                id: 'advancedNavigation',
                name: 'Navigation Avancée',
                age: 5,
                icon: '🚢',
                description: 'Grands navires pour le commerce lointain.',
                cost: 1400,
                prerequisites: ['navigation', 'marketplaces'],
                effects: { navigationBonus: 2.5, tradingBonus: 1.5 }
            },

            // ===============================
            // ÂGE 6 - INDUSTRIEL
            // ===============================
            mechanization: {
                id: 'mechanization',
                name: 'Mécanisation',
                age: 6,
                icon: '⚙️',
                description: 'Machines pour automatiser la production.',
                cost: 2000,
                prerequisites: ['ironWorking', 'architecture'],
                effects: { gatheringBonus: 3.0, buildSpeed: 2.0, miningBonus: 3.0 }
            },

            railways: {
                id: 'railways',
                name: 'Chemins de Fer',
                age: 6,
                icon: '🚂',
                description: 'Transport rapide sur rails.',
                cost: 2200,
                prerequisites: ['mechanization', 'roads'],
                effects: { speedBonus: 2.0, tradingBonus: 2.0 }
            },

            steamships: {
                id: 'steamships',
                name: 'Bateaux à Vapeur',
                age: 6,
                icon: '🚢',
                description: 'Navigation motorisée.',
                cost: 2100,
                prerequisites: ['mechanization', 'advancedNavigation'],
                effects: { navigationBonus: 3.5, speedBonus: 1.5 }
            },

            advancedMining: {
                id: 'advancedMining',
                name: 'Extraction Minière Avancée',
                age: 6,
                icon: '⛏️',
                description: 'Mines profondes et efficaces.',
                cost: 1900,
                prerequisites: ['mechanization'],
                effects: { miningBonus: 4.0 }
            },

            urbanization: {
                id: 'urbanization',
                name: 'Urbanisation',
                age: 6,
                icon: '🏙️',
                description: 'Grandes villes denses.',
                cost: 2300,
                prerequisites: ['railways', 'economy'],
                effects: { populationCap: 100, buildSpeed: 2.5 }
            },

            massProduction: {
                id: 'massProduction',
                name: 'Production de Masse',
                age: 6,
                icon: '🏭',
                description: 'Fabrication industrielle à grande échelle.',
                cost: 2500,
                prerequisites: ['mechanization', 'urbanization'],
                effects: { gatheringBonus: 4.0, foodEfficiency: 3.0 }
            },

            // ===============================
            // ÂGE 7 - MODERNE
            // ===============================
            electricity: {
                id: 'electricity',
                name: 'Électricité',
                age: 7,
                icon: '⚡',
                description: 'Énergie électrique pour tout.',
                cost: 3500,
                prerequisites: ['massProduction'],
                effects: { buildSpeed: 3.0, rpMultiplier: 3.0, speedBonus: 1.5 }
            },

            automobiles: {
                id: 'automobiles',
                name: 'Véhicules',
                age: 7,
                icon: '🚗',
                description: 'Transport motorisé individuel.',
                cost: 3200,
                prerequisites: ['mechanization', 'railways'],
                effects: { speedBonus: 3.0 }
            },

            heavyIndustry: {
                id: 'heavyIndustry',
                name: 'Industrie Lourde',
                age: 7,
                icon: '🏭',
                description: 'Production massive d\'acier et matériaux.',
                cost: 3800,
                prerequisites: ['electricity', 'massProduction'],
                effects: { buildSpeed: 4.0, miningBonus: 5.0 }
            },

            modernMedicine: {
                id: 'modernMedicine',
                name: 'Médecine Moderne',
                age: 7,
                icon: '🧬',
                description: 'Antibiotiques et chirurgie avancée.',
                cost: 3600,
                prerequisites: ['electricity'],
                effects: { lifespanBonus: 2.0, populationCap: 150 }
            },

            telecommunications: {
                id: 'telecommunications',
                name: 'Télécommunications',
                age: 7,
                icon: '📡',
                description: 'Communication instantanée mondiale.',
                cost: 4000,
                prerequisites: ['electricity'],
                effects: { rpMultiplier: 4.0, tradingBonus: 3.0 }
            },

            aviation: {
                id: 'aviation',
                name: 'Aviation',
                age: 7,
                icon: '✈️',
                description: 'Vol motorisé et transport aérien.',
                cost: 4200,
                prerequisites: ['automobiles', 'electricity'],
                effects: { speedBonus: 4.0, navigationBonus: 5.0 }
            },

            // ===============================
            // ÂGE 8 - FUTURISTE
            // ===============================
            artificialIntelligence: {
                id: 'artificialIntelligence',
                name: 'Intelligence Artificielle',
                age: 8,
                icon: '🤖',
                description: 'IA collective pour gérer la civilisation.',
                cost: 6000,
                prerequisites: ['telecommunications', 'modernMedicine'],
                effects: { rpMultiplier: 6.0, buildSpeed: 5.0 }
            },

            cleanEnergy: {
                id: 'cleanEnergy',
                name: 'Énergie Propre',
                age: 8,
                icon: '🌞',
                description: 'Solaire, éolien et fusion nucléaire.',
                cost: 5500,
                prerequisites: ['electricity', 'heavyIndustry'],
                effects: { treeRegrowthRate: 5.0, lifespanBonus: 2.5 }
            },

            globalCommunication: {
                id: 'globalCommunication',
                name: 'Communication Planétaire',
                age: 8,
                icon: '🌐',
                description: 'Réseau mondial instantané.',
                cost: 5800,
                prerequisites: ['telecommunications', 'artificialIntelligence'],
                effects: { rpMultiplier: 8.0, tradingBonus: 5.0 }
            },

            spaceColonization: {
                id: 'spaceColonization',
                name: 'Colonisation Spatiale',
                age: 8,
                icon: '🚀',
                description: 'Expansion au-delà de la planète.',
                cost: 8000,
                prerequisites: ['aviation', 'cleanEnergy', 'artificialIntelligence'],
                effects: { populationCap: 1000, navigationBonus: 10.0 }
            },

            nanotechnology: {
                id: 'nanotechnology',
                name: 'Nanotechnologie',
                age: 8,
                icon: '🔬',
                description: 'Manipulation de la matière à l\'échelle moléculaire.',
                cost: 7000,
                prerequisites: ['modernMedicine', 'heavyIndustry'],
                effects: { buildSpeed: 10.0, lifespanBonus: 3.0 }
            },

            transcendence: {
                id: 'transcendence',
                name: 'Transcendance',
                age: 8,
                icon: '✨',
                description: 'L\'humanité atteint un niveau supérieur d\'existence.',
                cost: 10000,
                prerequisites: ['spaceColonization', 'nanotechnology', 'globalCommunication'],
                effects: {
                    rpMultiplier: 10.0,
                    speedBonus: 10.0,
                    lifespanBonus: 5.0,
                    populationCap: 10000
                }
            }
        };
    }

    /**
     * Ajoute des points de recherche
     */
    addResearchPoints(amount) {
        const gain = amount * this.modifiers.rpMultiplier;
        this.researchPoints += gain;
        return gain;
    }

    /**
     * Met à jour la progression de recherche
     */
    update() {
        if (!this.currentResearchId) {
            this.startNextResearch();
            return;
        }

        const tech = this.techTree[this.currentResearchId];
        if (!tech) {
            this.currentResearchId = null;
            return;
        }

        // Allouer des RP à la recherche actuelle
        const rpToUse = Math.min(this.researchPoints, 1);
        this.progress += rpToUse;
        this.researchPoints -= rpToUse;

        // Vérifier si la recherche est terminée
        if (this.progress >= tech.cost) {
            this.completeResearch(this.currentResearchId);
            this.startNextResearch();
        }
    }

    /**
     * Termine une recherche et applique ses effets
     */
    completeResearch(techId) {
        const tech = this.techTree[techId];
        if (!tech) return;

        // Marquer comme débloquée
        this.unlockedTechs.push(techId);

        // Mettre à jour l'âge actuel
        if (tech.age > this.currentAge) {
            this.currentAge = tech.age;
            console.log(`🎉 Nouvel âge atteint : Âge ${this.currentAge}`);
        }

        // Appliquer les effets
        if (tech.effects) {
            for (let modifier in tech.effects) {
                if (modifier === 'populationCap') {
                    this.modifiers[modifier] = tech.effects[modifier];
                } else if (this.modifiers[modifier] !== undefined) {
                    this.modifiers[modifier] *= tech.effects[modifier];
                }
            }
        }

        console.log(`🔬 Recherche terminée: ${tech.name} (${tech.icon})`);

        return {
            type: 'research',
            tech: tech
        };
    }

    /**
     * Démarre la prochaine recherche disponible
     */
    startNextResearch() {
        this.currentResearchId = null;
        this.progress = 0;

        // Trouver la première technologie disponible
        for (let techId in this.techTree) {
            const tech = this.techTree[techId];

            // Déjà débloquée ?
            if (this.unlockedTechs.includes(techId)) continue;

            // Prérequis satisfaits ?
            const prereqsSatisfied = tech.prerequisites.every(prereq =>
                this.unlockedTechs.includes(prereq)
            );

            if (prereqsSatisfied) {
                this.currentResearchId = techId;
                this.progress = 0;
                console.log(`🔬 Nouvelle recherche: ${tech.name}`);
                return techId;
            }
        }

        return null;
    }

    /**
     * Retourne la recherche actuelle
     */
    getCurrentResearch() {
        if (!this.currentResearchId) return null;
        return this.techTree[this.currentResearchId];
    }

    /**
     * Retourne la progression de la recherche actuelle (0..1)
     */
    getResearchProgress() {
        const tech = this.getCurrentResearch();
        if (!tech) return 0;
        return Math.min(1, this.progress / tech.cost);
    }

    /**
     * Vérifie si une technologie est débloquée
     */
    hasResearch(techId) {
        return this.unlockedTechs.includes(techId);
    }

    /**
     * Retourne toutes les technologies avec leur statut
     */
    getAllTechsWithStatus() {
        const techs = [];

        for (let techId in this.techTree) {
            const tech = this.techTree[techId];

            let status = 'locked';
            if (this.unlockedTechs.includes(techId)) {
                status = 'unlocked';
            } else if (techId === this.currentResearchId) {
                status = 'inProgress';
            } else {
                const prereqsSatisfied = tech.prerequisites.every(prereq =>
                    this.unlockedTechs.includes(prereq)
                );
                if (prereqsSatisfied) {
                    status = 'available';
                }
            }

            techs.push({
                ...tech,
                status: status,
                progress: techId === this.currentResearchId ? this.getResearchProgress() : 0
            });
        }

        return techs;
    }

    /**
     * Retourne les technologies par âge
     */
    getTechsByAge(age) {
        return Object.values(this.techTree).filter(tech => tech.age === age);
    }
}
