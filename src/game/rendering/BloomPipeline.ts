// ============================================================
// Star Routes - Bloom Post-Processing Pipeline
// Soft glow effect for stars, routes, and UI elements
// ============================================================

import { Renderer } from 'phaser';

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uThreshold;

varying vec2 outTexCoord;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3846153846) * direction;
    vec2 off2 = vec2(3.2307692308) * direction;
    color += texture2D(image, uv) * 0.2270270270;
    color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
    color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
    color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
    color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
    return color;
}

void main() {
    vec4 original = texture2D(uMainSampler, outTexCoord);

    // Extract bright areas
    float brightness = dot(original.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec4 bright = original * smoothstep(uThreshold, uThreshold + 0.1, brightness);

    // Multi-pass blur approximation
    vec4 blurH = blur9(uMainSampler, outTexCoord, uResolution, vec2(2.0, 0.0));
    vec4 blurV = blur9(uMainSampler, outTexCoord, uResolution, vec2(0.0, 2.0));
    vec4 bloom = (blurH + blurV) * 0.5;

    // Combine original with bloom
    vec4 result = original + bloom * uIntensity * bright.a;
    result.a = original.a;

    gl_FragColor = result;
}
`;

export class BloomPipeline extends Renderer.WebGL.Pipelines.PostFXPipeline {
    private _intensity: number = 0.35;
    private _threshold: number = 0.3;

    constructor(game: Phaser.Game) {
        super({
            game,
            name: 'BloomPipeline',
            fragShader,
        });
    }

    onPreRender(): void {
        this.set1f('uIntensity', this._intensity);
        this.set1f('uThreshold', this._threshold);
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
    }

    setIntensity(value: number): this {
        this._intensity = value;
        return this;
    }

    setThreshold(value: number): this {
        this._threshold = value;
        return this;
    }
}
