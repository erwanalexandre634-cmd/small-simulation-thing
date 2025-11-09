/**
 * ===================================
 * TECHTREE.JS - Interface visuelle de l'arbre technologique
 * ===================================
 *
 * Ce module gère :
 * - Affichage de toutes les technologies par âge
 * - États visuels (locked, inProgress, unlocked)
 * - Connexions entre prérequis
 * - Panel togglable
 */

class TechTreeUI {
    constructor(culture) {
        this.culture = culture;
        this.isOpen = false;

        this.createTechTreePanel();
        this.createToggleButton();
    }

    /**
     * Crée le bouton pour ouvrir l'arbre tech
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'techTreeBtn';
        button.className = 'tech-tree-btn';
        button.innerHTML = '🔬 Technologies';
        button.title = 'Ouvrir l\'arbre technologique';

        button.addEventListener('click', () => this.toggle());

        // Ajouter après le canvas wrapper
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.insertAdjacentElement('afterend', button);
        }
    }

    /**
     * Crée le panel de l'arbre tech
     */
    createTechTreePanel() {
        const html = `
            <div id="techTreePanel" class="tech-tree-panel hidden">
                <div class="tech-tree-header">
                    <h2>🔬 Arbre Technologique</h2>
                    <button class="tech-tree-close" id="techTreeClose">×</button>
                </div>
                <div class="tech-tree-content" id="techTreeContent">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        this.panel = document.getElementById('techTreePanel');
        this.content = document.getElementById('techTreeContent');
        this.closeBtn = document.getElementById('techTreeClose');

        this.closeBtn.addEventListener('click', () => this.close());

        // Première génération
        this.render();
    }

    /**
     * Ouvre/ferme le panel
     */
    toggle() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.panel.classList.remove('hidden');
            this.render(); // Mise à jour
        } else {
            this.panel.classList.add('hidden');
        }
    }

    /**
     * Ferme le panel
     */
    close() {
        this.isOpen = false;
        this.panel.classList.add('hidden');
    }

    /**
     * Rend l'arbre technologique
     */
    render() {
        if (!this.culture || !this.culture.techTree) return;

        // Grouper les techs par âge
        const techsByAge = {};
        Object.values(this.culture.techTree).forEach(tech => {
            if (!techsByAge[tech.age]) {
                techsByAge[tech.age] = [];
            }
            techsByAge[tech.age].push(tech);
        });

        // Générer le HTML
        let html = '';

        for (let age = 1; age <= 8; age++) {
            const techs = techsByAge[age] || [];
            if (techs.length === 0) continue;

            const ageNames = [
                '', 'Préhistoire', 'Néolithique', 'Âge du Bronze', 'Âge du Fer',
                'Classique', 'Industriel', 'Moderne', 'Futuriste'
            ];

            const isCurrentAge = age === this.culture.currentAge;
            const ageClass = isCurrentAge ? 'current-age' : '';

            html += `
                <div class="tech-age-section ${ageClass}">
                    <div class="tech-age-header">
                        <span class="tech-age-number">Âge ${age}</span>
                        <span class="tech-age-name">${ageNames[age]}</span>
                        ${isCurrentAge ? '<span class="current-age-badge">★ Actuel</span>' : ''}
                    </div>
                    <div class="tech-age-techs">
                        ${techs.map(tech => this.renderTech(tech)).join('')}
                    </div>
                </div>
            `;
        }

        this.content.innerHTML = html;
    }

    /**
     * Rend une technologie individuelle
     */
    renderTech(tech) {
        // Déterminer le statut
        const isUnlocked = this.culture.unlockedTechs.includes(tech.id);
        const isInProgress = this.culture.currentResearchId === tech.id;
        const prereqsSatisfied = tech.prerequisites.every(prereq =>
            this.culture.unlockedTechs.includes(prereq)
        );

        let status = 'locked';
        let statusClass = 'tech-locked';
        let statusText = 'Verrouillé';

        if (isUnlocked) {
            status = 'unlocked';
            statusClass = 'tech-unlocked';
            statusText = 'Débloqué';
        } else if (isInProgress) {
            status = 'inProgress';
            statusClass = 'tech-in-progress';
            const progress = this.culture.getResearchProgress();
            statusText = `En cours (${Math.floor(progress * 100)}%)`;
        } else if (prereqsSatisfied) {
            status = 'available';
            statusClass = 'tech-available';
            statusText = 'Disponible';
        }

        // Construire la liste des effets
        const effects = tech.effects ? Object.entries(tech.effects).map(([key, value]) => {
            const effectNames = {
                rpMultiplier: 'Recherche',
                gatheringBonus: 'Collecte',
                speedBonus: 'Vitesse',
                foodEfficiency: 'Nourriture',
                buildSpeed: 'Construction',
                miningBonus: 'Minage',
                populationCap: 'Pop. Max',
                lifespanBonus: 'Longévité',
                tradingBonus: 'Commerce',
                navigationBonus: 'Navigation'
            };

            const name = effectNames[key] || key;
            const displayValue = key === 'populationCap' ? value : `×${value.toFixed(2)}`;

            return `<li>${name}: ${displayValue}</li>`;
        }).join('') : '';

        // Construire la liste des prérequis
        const prereqs = tech.prerequisites.length > 0
            ? `<div class="tech-prereqs">
                <strong>Prérequis:</strong>
                ${tech.prerequisites.map(prereq => {
                    const prereqTech = this.culture.techTree[prereq];
                    const isUnlocked = this.culture.unlockedTechs.includes(prereq);
                    return `<span class="prereq-item ${isUnlocked ? 'unlocked' : 'locked'}">
                        ${prereqTech ? prereqTech.icon : '?'} ${prereqTech ? prereqTech.name : prereq}
                    </span>`;
                }).join('')}
            </div>`
            : '';

        return `
            <div class="tech-card ${statusClass}" data-tech-id="${tech.id}">
                <div class="tech-card-header">
                    <span class="tech-icon">${tech.icon || '❓'}</span>
                    <span class="tech-name">${tech.name}</span>
                </div>
                <div class="tech-card-body">
                    <div class="tech-description">${tech.description}</div>
                    <div class="tech-cost">Coût: ${tech.cost} RP</div>
                    ${prereqs}
                    ${effects ? `<div class="tech-effects"><strong>Effets:</strong><ul>${effects}</ul></div>` : ''}
                </div>
                <div class="tech-card-footer">
                    <span class="tech-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }

    /**
     * Met à jour le panel (à appeler régulièrement)
     */
    update() {
        if (this.isOpen) {
            this.render();
        }
    }
}
