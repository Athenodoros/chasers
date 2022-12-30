import { Renderer } from "./renderer";
import { Simulation } from "./simulation";

export class CanvasSimulation {
    readonly renderer: Renderer;
    readonly simulation: Simulation;

    constructor(count: number, canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas);
        this.simulation = new Simulation(count, this.renderer.viewport);
        this.renderer.updateCanvasFrame(0, this.simulation.list);
    }

    update(dt: number) {
        this.simulation.update(dt, this.renderer.getImageData(), this.renderer.dpr);
        this.renderer.updateCanvasFrame(dt, this.simulation.list);
    }
}
