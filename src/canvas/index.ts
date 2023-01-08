import { Simulation } from "../utils/runner";
import { Renderer } from "./renderer";
import { CanvasPhysicsSimulation } from "./simulation";

export class CanvasSimulation implements Simulation {
    renderer: Renderer;
    simulation: CanvasPhysicsSimulation;
    count: number;

    constructor(count: number, canvas: HTMLCanvasElement) {
        this.count = count;
        this.renderer = new Renderer(canvas);
        this.simulation = new CanvasPhysicsSimulation(count, this.renderer.viewport);
        this.renderer.updateCanvasFrame(0, this.simulation.list);
    }

    update(dt: number) {
        this.simulation.update(dt, this.renderer.getImageData(), this.renderer.dpr);
        this.renderer.updateCanvasFrame(dt, this.simulation.list);
    }

    restart() {
        this.simulation = new CanvasPhysicsSimulation(this.count, this.renderer.viewport);
        this.renderer.updateCanvasFrame(0, this.simulation.list);
    }
}
