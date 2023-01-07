import { Runner } from "./runner";

export class WebGPUSimulation {
    static async from(chasers: number, canvas: HTMLCanvasElement) {
        const runner = await Runner.from(canvas, chasers);
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
