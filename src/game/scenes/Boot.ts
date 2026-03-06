// ============================================================
// Star Routes - Boot Scene
// Minimal setup, register pipelines, then go to Preloader
// ============================================================

import { Scene } from 'phaser';
import { COLORS } from '../config/constants';
import { BloomPipeline } from '../rendering/BloomPipeline';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Register bloom pipeline if WebGL renderer is available
        const renderer = this.renderer;
        if (renderer && 'pipelines' in renderer) {
            const webglRenderer = renderer as Phaser.Renderer.WebGL.WebGLRenderer;
            webglRenderer.pipelines.addPostPipeline('BloomPipeline', BloomPipeline);
        }

        this.scene.start('Preloader');
    }
}
