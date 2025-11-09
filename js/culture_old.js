/**
 * ===================================
 * CULTURE.JS - Système de recherche et évolution culturelle
 * ===================================
 *
 * Ce module gère :
 * - L'accumulation de points de recherche (RP)
 * - L'arbre technologique
 * - La progression de recherche automatique
 * - Les effets des technologies sur la simulation
 */

class Culture {
    constructor() {
        // Points de recherche accumulés
        this.researchPoints = 0;

        // Recherche actuelle
        this.currentResearchId = null;
        this.progress = 0; // Progression de la recherche actuelle (0..cost)

        // Technologies débloquées
        this.unlockedTechs = [];

        // Définition de l'arbre technologique
        this.techTree = {
            observation: {
                id: 'observation',
                name: 'Observation',
                description: 'Les humains observent leur environnement et apprennent plus rapidement.',
                cost: 100,
                prerequisites: [],
                effects: {
                    rpMultiplier: 1.5
                }
            },

            basicTools: {
                id: 'basicTools',
                name: 'Outils Primitifs',
                description: 'Création d\'outils simples en pierre. Améliore l\'efficacité de collecte.',
                cost: 200,
                prerequisites: ['observation'],
                effects: {
                    gatheringBonus: 1.3
                }
            },

            shelterArchitecture: {
                id: 'shelterArchitecture',
                name: 'Architecture d\'Abri',
                description: 'Meilleures techniques de construction. Les maisons restaurent plus d\'énergie.',
                cost: 250,
                prerequisites: ['observation'],
                effects: {
                    restBonus: 1.5
                }
            },

            agriculture: {
                id: 'agriculture',
                name: 'Agriculture',
                description: 'Cultivation de plantes. Les arbres repoussent plus rapidement.',
                cost: 400,
                prerequisites: ['basicTools'],
                effects: {
                    treeRegrowthRate: 2.0
                }
            },

            communalLiving: {
                id: 'communalLiving',
                name: 'Vie Communautaire',
                description: 'Organisation sociale améliorée. Limite de population augmentée.',
                cost: 300,
                prerequisites: ['shelterArchitecture'],
                effects: {
                    populationCap: 20
                }
            },

            hunting: {
                id: 'hunting',
                name: 'Chasse',
                description: 'Techniques de chasse organisée. Meilleure efficacité alimentaire.',
                cost: 350,
                prerequisites: ['basicTools'],
                effects: {
                    foodEfficiency: 1.4
                }
            },

            waterManagement: {
                id: 'waterManagement',
                name: 'Gestion de l\'Eau',
                description: 'Stockage et purification de l\'eau. Réduit la consommation de soif.',
                cost: 300,
                prerequisites: ['shelterArchitecture'],
                effects: {
                    thirstReduction: 0.7
                }
            },

            advancedTools: {
                id: 'advancedTools',
                name: 'Outils Avancés',
                description: 'Outils en métal. Augmente drastiquement l\'efficacité.',
                cost: 600,
                prerequisites: ['basicTools', 'hunting'],
                effects: {
                    gatheringBonus: 1.6,
                    speedBonus: 1.2
                }
            },

            medicine: {
                id: 'medicine',
                name: 'Médecine Primitive',
                description: 'Connaissances médicales de base. Augmente l\'espérance de vie.',
                cost: 500,
                prerequisites: ['observation', 'agriculture'],
                effects: {
                    lifespanBonus: 1.3
                }
            },

            writing: {
                id: 'writing',
                name: 'Écriture',
                description: 'Système d\'écriture primitif. Accélère grandement la recherche.',
                cost: 800,
                prerequisites: ['communalLiving', 'medicine'],
                effects: {
                    rpMultiplier: 2.5
                }
            }
        };

        // Multiplicateurs globaux (calculés à partir des techs débloquées)
        this.modifiers = {
            rpMultiplier: 1.0,
            gatheringBonus: 1.0,
            restBonus: 1.0,
            treeRegrowthRate: 1.0,
            populationCap: 10,
            foodEfficiency: 1.0,
            thirstReduction: 1.0,
            speedBonus: 1.0,
            lifespanBonus: 1.0
        };

        // Commencer la première recherche
        this.startNextResearch();
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
        const rpToUse = Math.min(this.researchPoints, 1); // Max 1 RP par tick
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

        // Appliquer les effets
        if (tech.effects) {
            for (let modifier in tech.effects) {
                if (modifier === 'populationCap') {
                    this.modifiers[modifier] = tech.effects[modifier];
                } else if (this.modifiers[modifier] !== undefined) {
                    // Multiplicateurs s'accumulent
                    this.modifiers[modifier] *= tech.effects[modifier];
                }
            }
        }

        console.log(`🔬 Recherche terminée: ${tech.name}`);

        // Retourner l'événement pour le log
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
     * Retourne toutes les technologies disponibles à rechercher
     */
    getAvailableTechs() {
        const available = [];

        for (let techId in this.techTree) {
            const tech = this.techTree[techId];

            // Déjà débloquée ?
            if (this.unlockedTechs.includes(techId)) continue;

            // Prérequis satisfaits ?
            const prereqsSatisfied = tech.prerequisites.every(prereq =>
                this.unlockedTechs.includes(prereq)
            );

            if (prereqsSatisfied) {
                available.push(tech);
            }
        }

        return available;
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
                // Vérifier si les prérequis sont satisfaits
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
}
