/**
 * ===================================
 * INSPECTOR.JS - Panneau d'inspection des humains
 * ===================================
 *
 * Ce module gère :
 * - Détection du survol d'un humain
 * - Affichage des détails (nom, âge, besoins, gènes, action, village)
 * - Panel latéral persistant
 */

class HumanInspector {
    constructor(camera) {
        this.camera = camera;
        this.selectedHuman = null;
        this.hoveredHuman = null;
        this.isEnabled = true;

        this.createInspectorPanel();
        this.initEvents();
    }

    /**
     * Crée le panel d'inspection
     */
    createInspectorPanel() {
        const html = `
            <div id="humanInspector" class="human-inspector">
                <div class="inspector-header">
                    <h3>👤 Inspecteur</h3>
                    <button class="inspector-close" id="inspectorClose">×</button>
                </div>
                <div class="inspector-content" id="inspectorContent">
                    <p class="inspector-empty">Survolez un humain pour voir ses détails</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        this.panel = document.getElementById('humanInspector');
        this.content = document.getElementById('inspectorContent');
        this.closeBtn = document.getElementById('inspectorClose');

        this.closeBtn.addEventListener('click', () => {
            this.panel.classList.add('hidden');
        });
    }

    /**
     * Initialise les événements
     */
    initEvents() {
        // L'événement hover sera géré depuis main.js via detectHover()
    }

    /**
     * Détecte si la souris survole un humain
     */
    detectHover(mouseEvent, humans) {
        if (!this.isEnabled) return null;

        const worldPos = this.camera.getMouseWorldPosition(mouseEvent);
        const tileSize = 4; // Taille standard d'une tuile
        const detectionRadius = tileSize * 2; // Rayon de détection

        // Chercher le humain le plus proche du curseur
        let closest = null;
        let closestDist = detectionRadius;

        humans.forEach(human => {
            const hx = human.x * tileSize + tileSize / 2;
            const hy = human.y * tileSize + tileSize / 2;

            const dx = worldPos.x - hx;
            const dy = worldPos.y - hy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closest = human;
                closestDist = dist;
            }
        });

        return closest;
    }

    /**
     * Met à jour le panel avec les infos d'un humain
     */
    inspectHuman(human, villageManager) {
        if (!human) {
            this.showEmpty();
            return;
        }

        this.selectedHuman = human;
        this.panel.classList.remove('hidden');

        // Trouver le village
        const village = villageManager.villages.find(v => v.id === human.villageId);

        // Générer le HTML
        const html = `
            <div class="inspector-section">
                <div class="inspector-title">
                    <span class="inspector-name">${human.name || `Humain #${human.id || '?'}`}</span>
                    <span class="inspector-badge">Gén. ${human.generation || 0}</span>
                </div>
                <div class="inspector-age">Âge: ${Math.floor(human.age || 0)} ans</div>
            </div>

            <div class="inspector-section">
                <div class="inspector-label">🏘️ Village</div>
                <div class="inspector-village" style="color: ${village ? village.color : '#888'}">
                    ${village ? village.name : 'Nomade'}
                </div>
            </div>

            <div class="inspector-section">
                <div class="inspector-label">⚡ Action Actuelle</div>
                <div class="inspector-action ${human.currentAction ? 'active' : ''}">
                    ${this.getActionDisplay(human)}
                </div>
            </div>

            <div class="inspector-section">
                <div class="inspector-label">❤️ Besoins</div>
                <div class="inspector-needs">
                    ${this.createNeedBar('Faim', human.hunger, 100, '#4CAF50')}
                    ${this.createNeedBar('Soif', human.thirst, 100, '#2196F3')}
                    ${this.createNeedBar('Énergie', human.energy, 100, '#FF9800')}
                </div>
            </div>

            <div class="inspector-section">
                <div class="inspector-label">🧬 Gènes</div>
                <div class="inspector-genes">
                    <div class="gene-item">
                        <span class="gene-name">Vitesse</span>
                        <span class="gene-value">${(human.genes?.speed || 1.0).toFixed(2)}x</span>
                    </div>
                    <div class="gene-item">
                        <span class="gene-name">Efficacité</span>
                        <span class="gene-value">${(human.genes?.efficiency || 1.0).toFixed(2)}x</span>
                    </div>
                    <div class="gene-item">
                        <span class="gene-name">Métabolisme</span>
                        <span class="gene-value">${(human.genes?.metabolism || 1.0).toFixed(2)}x</span>
                    </div>
                </div>
            </div>

            <div class="inspector-section">
                <div class="inspector-label">📍 Position</div>
                <div class="inspector-position">
                    X: ${Math.floor(human.x)}, Y: ${Math.floor(human.y)}
                </div>
            </div>

            ${human.house ? `
                <div class="inspector-section">
                    <div class="inspector-label">🏠 Domicile</div>
                    <div class="inspector-home">
                        (${Math.floor(human.house.x)}, ${Math.floor(human.house.y)})
                    </div>
                </div>
            ` : ''}
        `;

        this.content.innerHTML = html;
    }

    /**
     * Affiche l'état vide
     */
    showEmpty() {
        this.content.innerHTML = '<p class="inspector-empty">Survolez un humain pour voir ses détails</p>';
        this.selectedHuman = null;
    }

    /**
     * Crée une barre de besoin
     */
    createNeedBar(label, value, max, color) {
        const percent = Math.max(0, Math.min(100, (value / max) * 100));
        const criticalClass = percent < 20 ? 'critical' : '';

        return `
            <div class="need-bar ${criticalClass}">
                <div class="need-label">${label}</div>
                <div class="need-bar-container">
                    <div class="need-bar-fill" style="width: ${percent}%; background-color: ${color}"></div>
                </div>
                <div class="need-value">${Math.floor(value)}/${max}</div>
            </div>
        `;
    }

    /**
     * Retourne l'affichage de l'action actuelle
     */
    getActionDisplay(human) {
        if (!human.currentAction) {
            return '<span class="action-idle">Inactif / Errance</span>';
        }

        const actionIcons = {
            'drinking': '💧',
            'eating': '🍎',
            'building': '🔨',
            'resting': '😴',
            'mining': '⛏️',
            'farming': '🌾',
            'traveling': '🚶'
        };

        const icon = actionIcons[human.currentAction] || '⚙️';
        const progress = human.actionProgress ? Math.floor(human.actionProgress * 100) : 0;

        return `
            <span class="action-active">
                ${icon} ${human.currentAction}
                ${human.actionProgress !== undefined ? `<span class="action-progress">(${progress}%)</span>` : ''}
            </span>
        `;
    }

    /**
     * Toggle le panel
     */
    toggle() {
        this.panel.classList.toggle('hidden');
    }

    /**
     * Affiche ou masque le panel
     */
    show() {
        this.panel.classList.remove('hidden');
    }

    hide() {
        this.panel.classList.add('hidden');
    }
}
