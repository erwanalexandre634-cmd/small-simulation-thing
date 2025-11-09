# 🔥 PLAN DE REFACTORING COMPLET - EVOLUTION SIMULATOR RÉALISTE

## 🐛 BUGS CRITIQUES IDENTIFIÉS

### 1. Les humains meurent au début
**Problème:**
- hunger/thirst commencent à 30 et MONTENT vers 100 (mort)
- energy commence à 100 et DESCEND vers 0 (mort)
- Vitesse de consommation trop rapide en x4: 0.08 * 4 = 0.32/tick
- Seuils de décision trop hauts (70) = ils réagissent trop tard
- Pendant qu'ils marchent vers la nourriture, hunger continue de monter → mort

**Solutions:**
- Ajuster les valeurs initiales et seuils
- Ralentir la consommation des besoins
- Meilleure priorisation des actions
- Ne pas faire mourir si proche d'une ressource

### 2. Incohérence visuelle
- "Cercles chelous" = probablement des debug ou barres d'action
- Rochers vs cailloux = confusion terminologie

---

## 🎯 OBJECTIFS DE LA REFONTE

### Phase 1: SURVIE ET COHÉRENCE (URGENT)
1. ✅ Corriger les besoins des humains (survie garantie)
2. ✅ Nettoyer les visuels (enlever debug)
3. ✅ Améliorer l'IA (pas de vas-et-viens)
4. ✅ Renommer ressources cohérentes

### Phase 2: TECHNOLOGIES RÉALISTES
5. ⚡ FEU - Feux de camp visibles, chaleur, cuisson
6. ⚡ CHASSE - Humains chassent animaux (nouvelle entité)
7. ⚡ AGRICULTURE - Fermes, récoltes, stockage
8. ⚡ ROUTES - Chemins tracés entre bâtiments
9. ⚡ COMMERCE - Échange visible entre villages
10. ⚡ MÉTALLURGIE - Mines fonctionnelles, forges

### Phase 3: SIMULATION VIVANTE
11. 🌍 Cycle jour/nuit
12. 🌦️ Météo (pluie = croissance, hiver = famine)
13. 🦌 Animaux sauvages (gibier, prédateurs)
14. 🌾 Agriculture évolutive (champs, irrigation)
15. 🏛️ Monuments et merveilles

---

## 📐 ARCHITECTURE RÉALISTE

### Entités
- **Human**: Chasseur-cueilleur → Fermier → Artisan → Marchand
- **Animal**: Gibier (chevreuil, sanglier) + Prédateurs (loups)
- **Fire**: Feux de camp (chaleur, lumière, cuisson)
- **Farm**: Champs cultivés (blé, légumes)
- **Workshop**: Ateliers spécialisés (forge, poterie)
- **Market**: Marchés pour commerce

### Technologies avec effets VISIBLES
- **Feu**: Feux de camp allumés la nuit
- **Chasse**: Humains avec arcs, traquent animaux
- **Agriculture**: Champs apparaissent, humains plantent/récoltent
- **Routes**: Chemins dirt puis stone entre bâtiments
- **Écriture**: Bibliothèques, livres visibles
- **Métallurgie**: Forges avec fumée, armes/outils

---

## 🚀 PLAN D'IMPLÉMENTATION

### ÉTAPE 1: Corrections d'urgence (30 min)
- [ ] Fixer valeurs besoins (hunger 0→100 au lieu de 30→100)
- [ ] Ajuster seuils décision (chercher nourriture à 30 au lieu de 70)
- [ ] Ralentir consommation besoins (diviser par 2)
- [ ] Enlever cercles debug
- [ ] Renommer "Rock" → "Rocher", clarifier tout

### ÉTAPE 2: IA améliorée (1h)
- [ ] Refaire decideBehavior() complètement
- [ ] États: GATHERING, HUNTING, FARMING, RESTING, BUILDING, SOCIALIZING
- [ ] Pathfinding basique (éviter eau, préférer routes)
- [ ] Comportement de groupe (chasse en groupe)

### ÉTAPE 3: Technologies réalistes (2-3h)
- [ ] FIRE: Classe Campfire, rendu avec particules
- [ ] HUNTING: Classe Animal, IA de fuite, humains chassent
- [ ] FARMING: Classe Farm, cycle croissance, récolte
- [ ] ROUTES: Classe Road, auto-génération entre bâtiments
- [ ] TOOLS: Inventaire d'outils (hache, pioche, arc)

### ÉTAPE 4: Monde vivant (1-2h)
- [ ] Cycle jour/nuit (luminosité variable)
- [ ] Saisons (4 saisons, effets sur croissance)
- [ ] Météo (pluie, neige, sécheresse)
- [ ] Événements (migrations animaux, épidémies, découvertes)

---

## 💡 SYSTÈME RÉALISTE DE PROGRESSION

### Âge de Pierre (1-50 ans)
- Survie basique: cueillette, abris temporaires
- Découverte du feu → camps permanents
- Outils de pierre → chasse organisée

### Âge Néolithique (50-200 ans)
- Agriculture primitive → villages permanents
- Domestication animaux → élevage
- Poterie → stockage nourriture

### Âge du Bronze (200-500 ans)
- Métallurgie → outils/armes bronze
- Commerce → routes commerciales
- Écriture → administration

### Âge du Fer (500-1000 ans)
- Fer → révolution agricole
- Villes → urbanisation
- Monnaie → économie complexe

### Âges suivants...
- Moyen Âge → châteaux, corporations
- Renaissance → art, science
- Industriel → machines, usines
- Moderne → électricité, ordinateurs

---

## 🎨 VISUELS COHÉRENTS

### Palette de couleurs réaliste
- Terre: #8B7355, #A0826D
- Herbe: #5A8F3A, #6BA84A
- Eau: #4A90E2, #5DADE2
- Feu: #FF6B35, #F7931E
- Pierre: #75787B, #9BA2A6

### Entités stylisées mais lisibles
- Humains: Silhouettes simples, outils visibles
- Bâtiments: Style pixel-art cohérent
- Nature: Arbres variés, rochers réalistes
- Effets: Particules pour feu, fumée, pluie

---

## ⚡ OPTIMISATIONS

- Rendu par chunks (ne dessiner que visible)
- Pool d'objets pour particules
- Spatial hashing pour collisions
- Throttling des updates pour entités lointaines
- Cache des calculs de pathfinding

---

ON Y VA ! 🚀
