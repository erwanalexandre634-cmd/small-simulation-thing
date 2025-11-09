/**
 * ===================================
 * VILLAGESPANEL.JS - Panel des villages et cultures
 * ===================================
 *
 * Ce module gère :
 * - Liste de tous les villages
 * - Statistiques par village (pop, ressources, chef)
 * - Clic pour centrer la caméra
 * - Affichage des traits culturels
 */

class VillagesPanel {
    constructor(villageManager, camera) {
        this.villageManager = villageManager;
        this.camera = camera;
        this.isOpen = false;

        this.createVillagesPanel();
        this.createToggleButton();
    }

    /**
     * Crée le bouton pour ouvrir le panel
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'villagesPanelBtn';
        button.className = 'villages-panel-btn';
        button.innerHTML = '🏘️ Villages';
        button.title = 'Voir tous les villages';

        button.addEventListener('click', () => this.toggle());

        // Ajouter après le bouton tech tree
        const techBtn = document.getElementById('techTreeBtn');
        if (techBtn) {
            techBtn.insertAdjacentElement('afterend', button);
        }
    }

    /**
     * Crée le panel
     */
    createVillagesPanel() {
        const html = `
            <div id="villagesPanel" class="villages-panel hidden">
                <div class="villages-panel-header">
                    <h2>🏘️ Villages & Cultures</h2>
                    <button class="villages-panel-close" id="villagesPanelClose">×</button>
                </div>
                <div class="villages-panel-content" id="villagesPanelContent">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        this.panel = document.getElementById('villagesPanel');
        this.content = document.getElementById('villagesPanelContent');
        this.closeBtn = document.getElementById('villagesPanelClose');

        this.closeBtn.addEventListener('click', () => this.close());

        this.render();
    }

    /**
     * Ouvre/ferme le panel
     */
    toggle() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.panel.classList.remove('hidden');
            this.render();
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
     * Rend la liste des villages
     */
    render() {
        if (!this.villageManager || !this.villageManager.villages) {
            this.content.innerHTML = '<p class="villages-empty">Aucun village pour le moment</p>';
            return;
        }

        const villages = this.villageManager.villages;

        if (villages.length === 0) {
            this.content.innerHTML = '<p class="villages-empty">Aucun village fondé</p>';
            return;
        }

        // Trier par population
        const sorted = [...villages].sort((a, b) => b.humans.length - a.humans.length);

        let html = `
            <div class="villages-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Villages:</span>
                    <span class="summary-value">${villages.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Population Totale:</span>
                    <span class="summary-value">${villages.reduce((sum, v) => sum + v.humans.length, 0)}</span>
                </div>
            </div>
        `;

        sorted.forEach(village => {
            html += this.renderVillage(village);
        });

        this.content.innerHTML = html;

        // Ajouter les événements de clic
        this.attachClickEvents();
    }

    /**
     * Rend un village individuel
     */
    renderVillage(village) {
        const leader = village.leader;
        const leaderName = leader ? (leader.name || `Humain #${leader.id || '?'}`) : 'Aucun';

        // Ressources principales
        const resources = village.resources || { food: 0, wood: 0, stone: 0, iron: 0, gold: 0 };

        // Traits culturels (top 2)
        const traits = village.cultureTraits;
        const traitsList = traits ? [
            { name: 'Expansionnisme', value: traits.expansionism, icon: '🗺️' },
            { name: 'Innovation', value: traits.innovation, icon: '💡' },
            { name: 'Pacifisme', value: traits.pacifism, icon: '☮️' },
            { name: 'Collectivisme', value: traits.collectivism, icon: '🤝' }
        ].sort((a, b) => b.value - a.value).slice(0, 2) : [];

        return `
            <div class="village-card" data-village-id="${village.id}" data-village-x="${village.centerX}" data-village-y="${village.centerY}">
                <div class="village-card-header" style="border-left: 4px solid ${village.color}">
                    <div class="village-name">${village.name}</div>
                    <div class="village-population">${village.humans.length} habitants</div>
                </div>
                <div class="village-card-body">
                    <div class="village-info-row">
                        <span class="info-label">👑 Chef:</span>
                        <span class="info-value">${leaderName}</span>
                    </div>
                    <div class="village-info-row">
                        <span class="info-label">📍 Centre:</span>
                        <span class="info-value">(${Math.floor(village.centerX)}, ${Math.floor(village.centerY)})</span>
                    </div>
                    <div class="village-info-row">
                        <span class="info-label">🗺️ Territoire:</span>
                        <span class="info-value">${village.territory.length} tuiles</span>
                    </div>

                    <div class="village-resources">
                        <div class="resource-item">
                            <span class="resource-icon">🌾</span>
                            <span class="resource-amount">${Math.floor(resources.food)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-icon">🪵</span>
                            <span class="resource-amount">${Math.floor(resources.wood)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-icon">🪨</span>
                            <span class="resource-amount">${Math.floor(resources.stone)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-icon">⚙️</span>
                            <span class="resource-amount">${Math.floor(resources.iron)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-icon">💰</span>
                            <span class="resource-amount">${Math.floor(resources.gold)}</span>
                        </div>
                    </div>

                    ${traitsList.length > 0 ? `
                        <div class="village-traits">
                            <div class="traits-label">🎭 Traits Culturels:</div>
                            ${traitsList.map(trait => `
                                <div class="trait-item">
                                    <span class="trait-icon">${trait.icon}</span>
                                    <span class="trait-name">${trait.name}</span>
                                    <div class="trait-bar">
                                        <div class="trait-bar-fill" style="width: ${trait.value * 100}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="village-card-footer">
                    <button class="village-locate-btn" data-village-id="${village.id}">
                        📍 Localiser
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attache les événements de clic
     */
    attachClickEvents() {
        const locateBtns = this.content.querySelectorAll('.village-locate-btn');

        locateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const villageId = parseInt(e.target.dataset.villageId);
                const village = this.villageManager.villages.find(v => v.id === villageId);

                if (village && this.camera) {
                    this.camera.centerOn(village.centerX, village.centerY);
                    this.close(); // Fermer le panel après localisation
                }
            });
        });
    }

    /**
     * Met à jour le panel
     */
    update() {
        if (this.isOpen) {
            this.render();
        }
    }
}
