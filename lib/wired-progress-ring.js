var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { WiredBase, BaseCSS } from './wired-base';
import { ellipse, arc } from './wired-lib';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let WiredProgressRing = class WiredProgressRing extends WiredBase {
    constructor() {
        super(...arguments);
        this.value = 0;
        this.min = 0;
        this.max = 100;
        this.hideLabel = false;
        this.showLabelAsPercent = false;
        this.precision = 0;
    }
    static get styles() {
        return [
            BaseCSS,
            css `
      :host {
        display: inline-block;
        position: relative;
        width: 200px;
        font-family: sans-serif;
      }
      #overlay {
        position: relative;
      }
      path.progressArc {
        stroke-width: 10px;
        stroke: var(--wired-progress-color, blue);
      }
      #labelPanel {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: grid;
        align-content: center;
        align-items: center;
        justify-content: center;
        justify-items: center;
      }
      `
        ];
    }
    render() {
        let label = `${this.value}`;
        if (this.showLabelAsPercent) {
            const pct = 100 * Math.min(1, Math.max(0, (this.value - this.min) / (this.max - this.min)));
            if (this.precision) {
                label = `${pct.toPrecision(this.precision)}%`;
            }
            else {
                label = `${Math.round(pct)}%`;
            }
        }
        return html `
    <div id="overlay" class="overlay">
      <svg></svg>
    </div>
    
    ${this.hideLabel ? '' : html `
    <div id="labelPanel">
      <div>${label}</div>
    </div>
    `}

    `;
    }
    wiredRender(force = false) {
        super.wiredRender(force);
        this.refreshProgressFill();
    }
    canvasSize() {
        const s = this.getBoundingClientRect();
        return [s.width, s.width];
    }
    draw(svg, size) {
        const [x, y, w, h] = [size[0] / 2, size[1] / 2, size[0] - 10, size[1] - 10];
        ellipse(svg, x, y, w, h, this.seed);
    }
    refreshProgressFill() {
        if (this.progArc) {
            if (this.progArc.parentElement) {
                this.progArc.parentElement.removeChild(this.progArc);
            }
            this.progArc = undefined;
        }
        if (this.svg) {
            const size = this.canvasSize();
            const [x, y, w, h] = [size[0] / 2, size[1] / 2, size[0] - 10, size[1] - 10];
            const pct = Math.min(1, Math.max(0, (this.value - this.min) / (this.max - this.min)));
            if (pct) {
                this.progArc = arc(this.svg, x, y, w, h, -Math.PI / 2, 2 * Math.PI * pct - Math.PI / 2, this.seed);
                this.progArc.classList.add('progressArc');
            }
        }
    }
};
__decorate([
    property({ type: Number }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "value", void 0);
__decorate([
    property({ type: Number }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "min", void 0);
__decorate([
    property({ type: Number }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "max", void 0);
__decorate([
    property({ type: Boolean }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "hideLabel", void 0);
__decorate([
    property({ type: Boolean }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "showLabelAsPercent", void 0);
__decorate([
    property({ type: Number }),
    __metadata("design:type", Object)
], WiredProgressRing.prototype, "precision", void 0);
WiredProgressRing = __decorate([
    customElement('wired-progress-ring')
], WiredProgressRing);
export { WiredProgressRing };
