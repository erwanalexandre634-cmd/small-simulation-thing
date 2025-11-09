/**
 * ===================================
 * HELP.JS - Système de livre d'aide
 * ===================================
 *
 * Gère l'affichage du livre d'aide avec système d'onglets
 * - Effet glassmorphism
 * - Transitions fluides
 * - Navigation par onglets
 */

class HelpBook {
    constructor() {
        this.isOpen = false;
        this.currentTab = 'speed';

        // Contenu des onglets
        this.tabContent = {
            speed: {
                title: '⏱️ Vitesse & Pause',
                content: `
                    <p>Le temps s'écoule selon la vitesse que vous choisissez.</p>
                    <p>Utilisez les boutons de vitesse pour accélérer l'écoulement des années :</p>
                    <ul>
                        <li><strong>x1</strong> : Vitesse normale</li>
                        <li><strong>x2</strong> : Deux fois plus rapide</li>
                        <li><strong>x4</strong> : Quatre fois plus rapide</li>
                    </ul>
                    <p>Le grand bouton central vous permet de mettre en pause ou de reprendre la simulation à tout moment.</p>
                `
            },
            terrain: {
                title: '🗺️ Terrains',
                content: `
                    <p>Chaque couleur sur la carte représente un type de biome différent :</p>
                    <div class="terrain-list">
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #2b6cb0;"></span>
                            <strong>Eau</strong> : Les océans et mers qui entourent les continents
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #d4b66d;"></span>
                            <strong>Sable</strong> : Les côtes et plages qui bordent les terres
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #4caf50;"></span>
                            <strong>Plaines</strong> : Les terres fertiles au cœur des continents
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #777777;"></span>
                            <strong>Montagnes</strong> : Les zones rocheuses et reliefs élevés
                        </div>
                    </div>
                `
            },
            future: {
                title: '🔮 Avenir',
                content: `
                    <p>Ce n'est que le début d'une longue évolution...</p>
                    <p>Dans les prochaines versions du simulateur, vous verrez apparaître :</p>
                    <ul>
                        <li>🧬 <strong>La vie primitive</strong> : Les premières créatures unicellulaires</li>
                        <li>🦎 <strong>L'évolution</strong> : La sélection naturelle façonne les espèces</li>
                        <li>🧠 <strong>L'intelligence</strong> : Émergence de comportements complexes</li>
                        <li>🏛️ <strong>Les civilisations</strong> : Développement de sociétés organisées</li>
                        <li>⚔️ <strong>L'histoire</strong> : Guerres, commerce, expansion territoriale</li>
                    </ul>
                    <p class="future-note">Chaque forme de vie créera sa propre histoire unique sur ces terres...</p>
                `
            }
        };

        this.createBookElement();
        this.attachEventListeners();
    }

    /**
     * Crée l'élément du livre dans le DOM
     */
    createBookElement() {
        const bookHTML = `
            <div id="helpBook" class="help-book hidden">
                <div class="book-overlay"></div>
                <div class="book-container">
                    <div class="book-header">
                        <h2>📖 Guide du Simulateur</h2>
                        <button class="book-close">✖</button>
                    </div>

                    <div class="book-tabs">
                        <button class="book-tab active" data-tab="speed">Vitesse</button>
                        <button class="book-tab" data-tab="terrain">Terrains</button>
                        <button class="book-tab" data-tab="future">Avenir</button>
                    </div>

                    <div class="book-content">
                        <h3 id="bookContentTitle"></h3>
                        <div id="bookContentBody"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', bookHTML);

        this.bookElement = document.getElementById('helpBook');
        this.overlay = this.bookElement.querySelector('.book-overlay');
        this.closeBtn = this.bookElement.querySelector('.book-close');
        this.tabs = this.bookElement.querySelectorAll('.book-tab');
        this.contentTitle = document.getElementById('bookContentTitle');
        this.contentBody = document.getElementById('bookContentBody');
    }

    /**
     * Attache les événements
     */
    attachEventListeners() {
        // Bouton d'ouverture (sera lié depuis main.js)
        const openBtn = document.getElementById('helpBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        // Bouton de fermeture
        this.closeBtn.addEventListener('click', () => this.close());

        // Clic sur l'overlay pour fermer
        this.overlay.addEventListener('click', () => this.close());

        // Onglets
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Touche Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Ouvre le livre
     */
    open() {
        this.isOpen = true;
        this.bookElement.classList.remove('hidden');
        this.updateContent();

        // Animation d'entrée
        setTimeout(() => {
            this.bookElement.classList.add('active');
        }, 10);
    }

    /**
     * Ferme le livre
     */
    close() {
        this.isOpen = false;
        this.bookElement.classList.remove('active');

        // Attendre la fin de l'animation avant de cacher
        setTimeout(() => {
            this.bookElement.classList.add('hidden');
        }, 300);
    }

    /**
     * Change d'onglet
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // Mettre à jour l'état actif des onglets
        this.tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Mettre à jour le contenu avec animation
        this.contentBody.style.opacity = '0';

        setTimeout(() => {
            this.updateContent();
            this.contentBody.style.opacity = '1';
        }, 150);
    }

    /**
     * Met à jour le contenu affiché
     */
    updateContent() {
        const content = this.tabContent[this.currentTab];
        this.contentTitle.textContent = content.title;
        this.contentBody.innerHTML = content.content;
    }
}
