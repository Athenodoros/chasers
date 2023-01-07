import { Runner } from "./runner";

export class WebGPUSimulation {
    static async from(chasers: number, canvas: HTMLCanvasElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const runner = await Runner.from(canvas, Math.round(chasers / 1000));
        return new WebGPUSimulation(runner);
    }

    runner: Runner;

    constructor(runner: Runner) {
        this.runner = runner;
    }

    update(dt: number) {
        this.runner.render(dt);
    }
}
