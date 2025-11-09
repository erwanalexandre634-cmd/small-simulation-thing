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
        this.currentTab = 'controls';

        // Contenu des onglets - MANUEL COMPLET
        this.tabContent = {
            controls: {
                title: '⏱️ Contrôles & Interface',
                content: `
                    <h4>⏯️ Pause & Vitesse</h4>
                    <p>Le grand bouton central permet de mettre en pause ou reprendre la simulation.</p>
                    <p>Les boutons de vitesse accélèrent le temps :</p>
                    <ul>
                        <li><strong>x1</strong> : Vitesse normale</li>
                        <li><strong>x2</strong> : Deux fois plus rapide</li>
                        <li><strong>x4</strong> : Quatre fois plus rapide</li>
                    </ul>

                    <h4>🔍 Caméra</h4>
                    <ul>
                        <li><strong>Molette</strong> : Zoom avant/arrière (0.5x à 3x)</li>
                        <li><strong>Clic + Glisser</strong> : Déplacer la vue sur la carte</li>
                        <li><strong>Survol humain</strong> : Voir ses détails dans l'inspecteur</li>
                    </ul>

                    <h4>📊 Panneaux</h4>
                    <ul>
                        <li><strong>🔬 Technologies</strong> : Arbre technologique complet</li>
                        <li><strong>🏘️ Villages</strong> : Liste des villages et stats</li>
                        <li><strong>👤 Inspecteur</strong> : Détails de l'humain survolé</li>
                        <li><strong>📜 Journal</strong> : Événements majeurs (bas-droite)</li>
                    </ul>
                `
            },
            world: {
                title: '🗺️ Monde & Biomes',
                content: `
                    <h4>Terrains</h4>
                    <div class="terrain-list">
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #2b6cb0;"></span>
                            <strong>Eau</strong> : Océans et mers. Traversable par bateaux uniquement.
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #d4b66d;"></span>
                            <strong>Sable</strong> : Côtes. Peu fertile, peu de ressources.
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #4caf50;"></span>
                            <strong>Plaines</strong> : Terres fertiles. Bois, nourriture abondants.
                        </div>
                        <div class="terrain-item">
                            <span class="terrain-dot" style="background: #777777;"></span>
                            <strong>Montagnes</strong> : Zones rocheuses. Minerais (pierre, fer, or).
                        </div>
                    </div>

                    <h4>🌳 Ressources Naturelles</h4>
                    <ul>
                        <li><strong>🌾 Nourriture</strong> : Arbres fruitiers, chasse, pêche, fermes</li>
                        <li><strong>🪵 Bois</strong> : Forêts denses dans les plaines</li>
                        <li><strong>🪨 Pierre</strong> : Montagnes et carrières</li>
                        <li><strong>⚙️ Fer</strong> : Mines dans les montagnes riches</li>
                        <li><strong>💰 Or</strong> : Mines rares dans hautes montagnes</li>
                    </ul>

                    <p><em>Les ressources se régénèrent lentement. Les technologies augmentent la vitesse de régénération.</em></p>
                `
            },
            humans: {
                title: '🧍 Humains & Besoins',
                content: `
                    <h4>❤️ Besoins Vitaux</h4>
                    <p>Chaque humain a trois besoins qui diminuent avec le temps :</p>
                    <ul>
                        <li><strong>Faim (0-100)</strong> : Restaurée en mangeant (arbres, fermes)</li>
                        <li><strong>Soif (0-100)</strong> : Restaurée en buvant (eau, puits)</li>
                        <li><strong>Énergie (0-100)</strong> : Restaurée en se reposant (maisons)</li>
                    </ul>
                    <p>⚠️ <strong>Si un besoin atteint 0, l'humain meurt.</strong></p>

                    <h4>🧠 Intelligence Artificielle</h4>
                    <p>Les humains agissent de manière autonome selon leurs besoins :</p>
                    <ul>
                        <li>Chercher nourriture quand faim < 30</li>
                        <li>Chercher eau quand soif < 30</li>
                        <li>Se reposer dans une maison quand énergie < 20</li>
                        <li>Construire une maison s'ils n'en ont pas</li>
                        <li>Se reproduire si besoins > 60 et population < limite</li>
                    </ul>

                    <h4>🧬 Système Génétique</h4>
                    <p>Chaque humain possède 3 gènes hérités et mutables :</p>
                    <ul>
                        <li><strong>Vitesse</strong> : Déplacement plus/moins rapide</li>
                        <li><strong>Efficacité</strong> : Collecte/travail plus/moins productif</li>
                        <li><strong>Métabolisme</strong> : Consommation besoins plus/moins lente</li>
                    </ul>
                    <p>Lors de la reproduction, les gènes mutent légèrement (±10%), créant une évolution naturelle.</p>
                `
            },
            villages: {
                title: '🏘️ Villages & Cultures',
                content: `
                    <h4>🏘️ Formation des Villages</h4>
                    <p>Un village se forme automatiquement quand <strong>3+ maisons</strong> sont proches (< 10 tuiles).</p>
                    <p>Chaque village a :</p>
                    <ul>
                        <li>Un <strong>nom unique</strong> (ex: Novaville, Terragrad)</li>
                        <li>Une <strong>couleur</strong> pour ses frontières</li>
                        <li>Un <strong>territoire</strong> (rayon autour du centre)</li>
                        <li>Des <strong>ressources communes</strong> (stockage partagé)</li>
                        <li>Un <strong>chef</strong> (humain le plus âgé/intelligent)</li>
                    </ul>

                    <h4>👑 Chefs & Leadership</h4>
                    <p>Le chef influence les priorités du village :</p>
                    <ul>
                        <li>Direction de recherche</li>
                        <li>Comportement (expansion, défense, commerce)</li>
                        <li>Changement automatique à la mort du chef</li>
                    </ul>

                    <h4>🎭 Traits Culturels</h4>
                    <p>Chaque village a des traits uniques générés aléatoirement :</p>
                    <ul>
                        <li><strong>Expansionnisme</strong> : Envie d'agrandir le territoire</li>
                        <li><strong>Innovation</strong> : Vitesse de recherche accrue</li>
                        <li><strong>Pacifisme</strong> : Évite les conflits</li>
                        <li><strong>Collectivisme</strong> : Partage efficace des ressources</li>
                        <li><strong>Nomadisme</strong> : Tendance à migrer et fonder de nouveaux villages</li>
                    </ul>

                    <h4>🗺️ Territoires & Frontières</h4>
                    <p>Les frontières colorées montrent les limites de chaque village.</p>
                    <p>Le territoire s'étend automatiquement si la population augmente.</p>
                    <p>Si deux villages se touchent : fusion ou séparation culturelle possible.</p>
                `
            },
            buildings: {
                title: '🏗️ Bâtiments & Infrastructures',
                content: `
                    <h4>🏠 Bâtiments de Base</h4>
                    <ul>
                        <li><strong>Maison</strong> : Repos, reproduction. Construit automatiquement par humains.</li>
                    </ul>

                    <h4>🏭 Bâtiments Avancés (débloqués par technologies)</h4>
                    <ul>
                        <li><strong>⛏️ Mine</strong> : Extrait pierre/fer/or des montagnes (tech: Mining)</li>
                        <li><strong>🌾 Ferme</strong> : Produit nourriture régulièrement (tech: Agriculture)</li>
                        <li><strong>⚓ Port</strong> : Permet construction de bateaux (tech: Navigation)</li>
                        <li><strong>🔨 Atelier</strong> : Produit outils, améliore efficacité (tech: Iron Working)</li>
                        <li><strong>🏛️ Marché</strong> : Échange ressources entre villages (tech: Marketplaces)</li>
                    </ul>

                    <h4>🛣️ Routes</h4>
                    <p>Les routes se créent <strong>automatiquement</strong> entre bâtiments proches après "Roads" tech.</p>
                    <ul>
                        <li><strong>Chemins de terre</strong> : Bonus vitesse +30%</li>
                        <li><strong>Routes pavées</strong> : Bonus vitesse +50% (usage intensif)</li>
                    </ul>
                    <p>Les humains empruntent automatiquement les routes pour se déplacer plus vite.</p>

                    <h4>⚓ Ports & Navigation</h4>
                    <p>Après tech "Navigation", les villages côtiers peuvent :</p>
                    <ul>
                        <li>Construire un <strong>Port</strong> sur la côte</li>
                        <li>Créer des <strong>Bateaux</strong> pour traverser l'eau</li>
                        <li>Explorer et coloniser d'autres îles/continents</li>
                    </ul>
                `
            },
            technologies: {
                title: '🔬 Technologies & Recherche',
                content: `
                    <h4>📊 Système de Recherche</h4>
                    <p>La civilisation accumule des <strong>Points de Recherche (RP)</strong> de plusieurs sources :</p>
                    <ul>
                        <li>Actions des humains (manger, boire, construire)</li>
                        <li>Population (plus d'humains = plus de RP)</li>
                        <li>Bâtiments productifs (fermes, ateliers)</li>
                    </ul>

                    <h4>🎯 Progression Automatique</h4>
                    <p>Le jeu choisit automatiquement la prochaine technologie disponible :</p>
                    <ol>
                        <li>Prérequis satisfaits ✓</li>
                        <li>Coût le plus bas</li>
                        <li>Âge le plus bas</li>
                    </ol>

                    <h4>🌟 Les 8 Âges</h4>
                    <ul>
                        <li><strong>1 - Préhistoire</strong> : Feu, outils primitifs, chasse</li>
                        <li><strong>2 - Néolithique</strong> : Agriculture, élevage, poterie</li>
                        <li><strong>3 - Bronze</strong> : Métallurgie, routes, navigation</li>
                        <li><strong>4 - Fer</strong> : Architecture, écriture, religion</li>
                        <li><strong>5 - Classique</strong> : Philosophie, arts, économie</li>
                        <li><strong>6 - Industriel</strong> : Machines, chemins de fer, usines</li>
                        <li><strong>7 - Moderne</strong> : Électricité, voitures, aviation</li>
                        <li><strong>8 - Futuriste</strong> : IA, énergie propre, espace</li>
                    </ul>

                    <h4>⚡ Effets des Technologies</h4>
                    <p>Chaque technologie a des <strong>effets réels et visibles</strong> :</p>
                    <ul>
                        <li>Modificateurs (vitesse, efficacité, production)</li>
                        <li>Déblocage de nouveaux bâtiments</li>
                        <li>Nouvelles capacités (navigation, minage, etc.)</li>
                        <li>Augmentation limite de population</li>
                    </ul>

                    <p><em>Cliquez sur le bouton "🔬 Technologies" pour voir l'arbre complet.</em></p>
                `
            },
            events: {
                title: '📜 Journal & Événements',
                content: `
                    <h4>📜 Journal d'Événements</h4>
                    <p>Le journal (bas-droite) enregistre tous les événements majeurs :</p>

                    <h4>Types d'Événements</h4>
                    <ul>
                        <li><strong>👶 Naissances</strong> : Nouveau-né (génération X)</li>
                        <li><strong>💀 Décès</strong> : Mort d'un humain (âge, cause)</li>
                        <li><strong>🏠 Constructions</strong> : Nouveau bâtiment terminé</li>
                        <li><strong>🔬 Recherches</strong> : Nouvelle tech démarrée/terminée</li>
                        <li><strong>🏘️ Villages</strong> : Village fondé, chef élu</li>
                        <li><strong>🎉 Jalons</strong> : Passage à un nouvel âge, population milestone</li>
                    </ul>

                    <h4>📊 Format</h4>
                    <p>Chaque événement affiche :</p>
                    <ul>
                        <li><strong>Année</strong> : Moment de l'événement</li>
                        <li><strong>Icône</strong> : Type visuel</li>
                        <li><strong>Message</strong> : Détails (ex: "Village 'Lumen' a terminé : Maîtrise du Feu")</li>
                    </ul>

                    <p>Les 50 derniers événements sont conservés (les anciens sont supprimés).</p>
                    <p>Cliquez sur le header du journal pour le réduire/agrandir.</p>
                `
            },
            tips: {
                title: '💡 Astuces & Stratégie',
                content: `
                    <h4>🎮 Comment Bien Observer</h4>
                    <ul>
                        <li>Zoomez pour voir les détails (humains, actions, bâtiments)</li>
                        <li>Dézoomez pour voir les territoires et mouvements globaux</li>
                        <li>Survolez les humains pour voir leurs besoins en temps réel</li>
                        <li>Ouvrez le panel Villages pour suivre la croissance</li>
                    </ul>

                    <h4>⚡ Accélérer l'Évolution</h4>
                    <ul>
                        <li>Vitesse x4 pour sauter rapidement les premières années</li>
                        <li>Pause pour examiner une situation intéressante</li>
                        <li>Les technologies ralentissent avec les âges (coûts plus élevés)</li>
                    </ul>

                    <h4>🎯 Objectifs à Observer</h4>
                    <ul>
                        <li>Premier village formé (3+ maisons)</li>
                        <li>Passage à l'Âge 2 (Néolithique)</li>
                        <li>Première route créée</li>
                        <li>Premier bateau lancé</li>
                        <li>Population > 50 habitants</li>
                        <li>Village couvrant > 100 tuiles</li>
                        <li>Atteindre l'Âge Futuriste</li>
                    </ul>

                    <h4>🔍 Comprendre les Crises</h4>
                    <ul>
                        <li><strong>Famine</strong> : Trop de population, pas assez d'arbres/fermes</li>
                        <li><strong>Sécheresse</strong> : Manque de points d'eau accessibles</li>
                        <li><strong>Stagnation</strong> : Population trop faible, pas assez de RP</li>
                    </ul>

                    <p><em>C'est une simulation autonome : laissez faire et observez l'histoire se dérouler !</em></p>
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
                        <button class="book-tab active" data-tab="controls">Contrôles</button>
                        <button class="book-tab" data-tab="world">Monde</button>
                        <button class="book-tab" data-tab="humans">Humains</button>
                        <button class="book-tab" data-tab="villages">Villages</button>
                        <button class="book-tab" data-tab="buildings">Bâtiments</button>
                        <button class="book-tab" data-tab="technologies">Technologies</button>
                        <button class="book-tab" data-tab="events">Journal</button>
                        <button class="book-tab" data-tab="tips">Astuces</button>
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
