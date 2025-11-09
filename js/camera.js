/**
 * ===================================
 * CAMERA.JS - Système de caméra avec zoom et drag
 * ===================================
 *
 * Ce module gère :
 * - Le zoom avec la molette (limites min/max)
 * - Le drag avec la souris (déplacement fluide)
 * - Les transformations coordonnées monde ↔ écran
 * - Les limites du viewport (ne pas sortir de la carte)
 */

class Camera {
    constructor(canvas, map) {
        this.canvas = canvas;
        this.map = map;

        // Position de la caméra (en coordonnées monde)
        this.x = 0;
        this.y = 0;

        // Zoom (1 = normal, >1 = zoom in, <1 = zoom out)
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomSpeed = 0.1;

        // État du drag
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCamX = 0;
        this.dragStartCamY = 0;

        // Limites de la caméra (calculées en fonction de la carte)
        this.updateBounds();

        // Initialiser les événements
        this.initEvents();

        // Centrer la caméra au démarrage
        this.centerOnMap();
    }

    /**
     * Initialise les événements de souris
     */
    initEvents() {
        // Zoom avec la molette
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            // Coordonnées monde avant zoom
            const worldBeforeX = this.screenToWorldX(mouseX);
            const worldBeforeY = this.screenToWorldY(mouseY);

            // Appliquer le zoom
            const zoomDelta = -Math.sign(e.deltaY) * this.zoomSpeed;
            const newZoom = this.clamp(this.zoom + zoomDelta, this.minZoom, this.maxZoom);

            // Si le zoom change
            if (newZoom !== this.zoom) {
                this.zoom = newZoom;

                // Coordonnées monde après zoom
                const worldAfterX = this.screenToWorldX(mouseX);
                const worldAfterY = this.screenToWorldY(mouseY);

                // Ajuster la position pour zoomer vers le curseur
                this.x += (worldBeforeX - worldAfterX);
                this.y += (worldBeforeY - worldAfterY);

                this.constrainPosition();
            }
        });

        // Drag avec la souris
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartCamX = this.x;
            this.dragStartCamY = this.y;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;

                // Déplacer la caméra (inverse car on déplace le monde)
                this.x = this.dragStartCamX - (dx / this.zoom);
                this.y = this.dragStartCamY - (dy / this.zoom);

                this.constrainPosition();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'default';
            }
        });

        // Curseur initial
        this.canvas.style.cursor = 'grab';
    }

    /**
     * Centre la caméra sur le centre de la carte
     */
    centerOnMap() {
        const worldWidth = this.map.width * this.map.tileSize;
        const worldHeight = this.map.height * this.map.tileSize;

        this.x = (worldWidth - this.canvas.width / this.zoom) / 2;
        this.y = (worldHeight - this.canvas.height / this.zoom) / 2;

        this.constrainPosition();
    }

    /**
     * Centre la caméra sur une position donnée (en tuiles)
     */
    centerOn(tileX, tileY) {
        const worldX = tileX * this.map.tileSize + this.map.tileSize / 2;
        const worldY = tileY * this.map.tileSize + this.map.tileSize / 2;

        this.x = worldX - (this.canvas.width / this.zoom) / 2;
        this.y = worldY - (this.canvas.height / this.zoom) / 2;

        this.constrainPosition();
    }

    /**
     * Met à jour les limites de la caméra
     */
    updateBounds() {
        this.minX = 0;
        this.minY = 0;
        this.maxX = this.map.width * this.map.tileSize;
        this.maxY = this.map.height * this.map.tileSize;
    }

    /**
     * Contraint la position de la caméra dans les limites
     */
    constrainPosition() {
        const viewWidth = this.canvas.width / this.zoom;
        const viewHeight = this.canvas.height / this.zoom;

        // Si la vue est plus grande que la carte (zoom out max), centrer la carte
        if (viewWidth >= this.maxX) {
            this.x = (this.maxX - viewWidth) / 2;
        } else {
            // Empêcher de sortir de la carte (à gauche/droite)
            this.x = this.clamp(this.x, this.minX, this.maxX - viewWidth);
        }

        if (viewHeight >= this.maxY) {
            this.y = (this.maxY - viewHeight) / 2;
        } else {
            // Empêcher de sortir de la carte (haut/bas)
            this.y = this.clamp(this.y, this.minY, this.maxY - viewHeight);
        }
    }

    /**
     * Convertit coordonnées écran → monde
     */
    screenToWorldX(screenX) {
        return this.x + screenX / this.zoom;
    }

    screenToWorldY(screenY) {
        return this.y + screenY / this.zoom;
    }

    /**
     * Convertit coordonnées monde → écran
     */
    worldToScreenX(worldX) {
        return (worldX - this.x) * this.zoom;
    }

    worldToScreenY(worldY) {
        return (worldY - this.y) * this.zoom;
    }

    /**
     * Applique la transformation de la caméra au contexte
     */
    applyTransform(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Restaure le contexte après transformation
     */
    restoreTransform(ctx) {
        ctx.restore();
    }

    /**
     * Vérifie si un point monde est visible à l'écran
     */
    isVisible(worldX, worldY, margin = 0) {
        const viewWidth = this.canvas.width / this.zoom;
        const viewHeight = this.canvas.height / this.zoom;

        return worldX >= this.x - margin &&
               worldX <= this.x + viewWidth + margin &&
               worldY >= this.y - margin &&
               worldY <= this.y + viewHeight + margin;
    }

    /**
     * Récupère la position de la souris en coordonnées monde
     */
    getMouseWorldPosition(mouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = mouseEvent.clientX - rect.left;
        const screenY = mouseEvent.clientY - rect.top;

        return {
            x: this.screenToWorldX(screenX),
            y: this.screenToWorldY(screenY)
        };
    }

    /**
     * Utilitaire : clamp une valeur
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Reset la caméra
     */
    reset() {
        this.zoom = 1.0;
        this.centerOnMap();
    }

    /**
     * Obtient les infos de la caméra (pour debug)
     */
    getInfo() {
        return {
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            zoom: this.zoom.toFixed(2),
            isDragging: this.isDragging
        };
    }
}
