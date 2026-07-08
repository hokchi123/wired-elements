import { WiredBase, Point } from './wired-base';
import { TemplateResult, CSSResultArray } from 'lit';
export declare class WiredProgressRing extends WiredBase {
    value: number;
    min: number;
    max: number;
    hideLabel: boolean;
    showLabelAsPercent: boolean;
    precision: number;
    private progArc?;
    static get styles(): CSSResultArray;
    render(): TemplateResult;
    wiredRender(force?: boolean): void;
    protected canvasSize(): Point;
    protected draw(svg: SVGSVGElement, size: Point): void;
    private refreshProgressFill;
}
