/**
 * ===================================
 * EVENTLOG.JS - Système de journal d'événements
 * ===================================
 *
 * Ce module gère :
 * - L'enregistrement des événements majeurs
 * - L'affichage dans une liste scrollable
 * - La limite de 50 événements maximum
 */

class EventLog {
    constructor() {
        this.events = [];
        this.maxEvents = 50;
        this.currentYear = 0;

        this.createLogElement();
    }

    /**
     * Crée l'élément du journal dans le DOM
     */
    createLogElement() {
        const logHTML = `
            <div id="eventLog" class="event-log">
                <div class="event-log-header">
                    <h3>📜 Journal d'Événements</h3>
                    <button class="event-log-toggle" id="eventLogToggle">−</button>
                </div>
                <div class="event-log-content" id="eventLogContent">
                    <p class="event-log-empty">Aucun événement pour le moment...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', logHTML);

        this.logElement = document.getElementById('eventLog');
        this.contentElement = document.getElementById('eventLogContent');
        this.toggleBtn = document.getElementById('eventLogToggle');

        // Bouton pour réduire/agrandir
        this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    /**
     * Réduit ou agrandit le journal
     */
    toggle() {
        this.logElement.classList.toggle('collapsed');
        this.toggleBtn.textContent = this.logElement.classList.contains('collapsed') ? '+' : '−';
    }

    /**
     * Met à jour l'année actuelle (pour les timestamps)
     */
    setCurrentYear(year) {
        this.currentYear = year;
    }

    /**
     * Ajoute un événement au journal
     */
    logEvent(message, category = 'info') {
        const event = {
            year: Math.floor(this.currentYear),
            message: message,
            category: category,
            timestamp: Date.now()
        };

        // Ajouter en tête de liste
        this.events.unshift(event);

        // Limiter à maxEvents
        if (this.events.length > this.maxEvents) {
            this.events.pop();
        }

        // Mettre à jour l'affichage
        this.render();
    }

    /**
     * Logs spécialisés pour différents types d'événements
     */
    logBirth(generation) {
        this.logEvent(`Un nouvel humain est né (Génération ${generation})`, 'birth');
    }

    logDeath(age, generation) {
        this.logEvent(`Un humain est mort à l'âge de ${age} ans (Gén. ${generation})`, 'death');
    }

    logBuilding() {
        this.logEvent(`Une maison a été construite`, 'building');
    }

    logResearch(techName) {
        this.logEvent(`Nouvelle recherche : ${techName}`, 'research');
    }

    logResearchComplete(techName) {
        this.logEvent(`Recherche terminée : ${techName}`, 'research-complete');
    }

    logPopulationMilestone(population) {
        this.logEvent(`La population atteint ${population} habitants !`, 'milestone');
    }

    /**
     * Affiche le journal
     */
    render() {
        if (this.events.length === 0) {
            this.contentElement.innerHTML = '<p class="event-log-empty">Aucun événement pour le moment...</p>';
            return;
        }

        let html = '';

        for (let event of this.events) {
            const categoryClass = `event-${event.category}`;
            const icon = this.getCategoryIcon(event.category);

            html += `
                <div class="event-item ${categoryClass}">
                    <span class="event-icon">${icon}</span>
                    <span class="event-year">An ${event.year}</span>
                    <span class="event-message">${event.message}</span>
                </div>
            `;
        }

        this.contentElement.innerHTML = html;

        // Auto-scroll vers le haut (nouveau événement)
        this.contentElement.scrollTop = 0;
    }

    /**
     * Retourne l'icône pour chaque catégorie
     */
    getCategoryIcon(category) {
        const icons = {
            birth: '👶',
            death: '💀',
            building: '🏠',
            research: '🔬',
            'research-complete': '✅',
            milestone: '🎉',
            info: 'ℹ️'
        };

        return icons[category] || icons.info;
    }

    /**
     * Efface tous les événements
     */
    clear() {
        this.events = [];
        this.render();
    }
}
