import { Runner } from "./runner";

export class WebGPUSimulation {
    static async from(chasers: number, canvas: HTMLCanvasElement) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

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
