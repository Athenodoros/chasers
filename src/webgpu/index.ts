import { Simulation } from "../utils/runner";
import { Runner } from "./runner";

export class WebGPUSimulation implements Simulation {
    canvas: HTMLCanvasElement;
    chasers: number;
    controls: HTMLElement[];

    static async from(
        chasers: number,
        canvas: HTMLCanvasElement,
        acceleration: number = 5,
        velocity: number = 50,
        sensor: number = 10,
        range: number = 2,
        halflife: number = 0.1
    ) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        const runner = await Runner.from(
            canvas,
            Math.round(chasers / 1000),
            acceleration,
            velocity,
            sensor,
            range,
            halflife
        );
        return new WebGPUSimulation(runner, canvas, chasers, acceleration, velocity, sensor, range, halflife);
    }

    runner: Runner;

    constructor(
        runner: Runner,
        canvas: HTMLCanvasElement,
        chasers: number,
        acceleration: number,
        velocity: number,
        sensor: number,
        range: number,
        halflife: number
    ) {
        this.runner = runner;
        this.canvas = canvas;
        this.chasers = chasers;

        const chasersInputWrapper = document.createElement("div");
        chasersInputWrapper.setAttribute("style", "display: flex");
        const chasersInput = document.createElement("input");
        chasersInput.setAttribute("style", "flex-shrink: 1; min-width: 0;");
        chasersInput.defaultValue = "" + chasers;
        const chasersInputButton = document.createElement("button");
        chasersInputButton.innerText = "Restart";
        chasersInputButton.onclick = () => {
            const newChasers = Number(chasersInput.value || chasers);
            if (newChasers && !isNaN(newChasers)) {
                this.chasers = newChasers;
                this.restart();
            }
        };
        chasersInputWrapper.append(chasersInput, chasersInputButton);

        this.controls = [
            chasersInputWrapper,
            getNumericController("Acceleration", acceleration, this.runner.setAcceleration),
            getNumericController("Velocity", velocity, this.runner.setVelocity),
            getNumericController("Sensor", sensor, this.runner.setSensor),
            getNumericController("Range", range, this.runner.setRange),
            getNumericController("Halflife", halflife, this.runner.setHalflife),
        ];
    }

    update(dt: number) {
        this.runner.render(dt);
    }

    restart() {
        Runner.from(this.canvas, Math.max(Math.round(this.chasers / 1000), 1)).then((runner) => (this.runner = runner));
    }
}

const getNumericController = (name: string, value: number, useValue: (updated: number) => void) => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("style", "display: flex");
    const title = document.createElement("p");
    title.setAttribute("style", "flex-grow: 1; margin: 0");
    title.innerText = name + ":";
    const input = document.createElement("input");
    input.setAttribute("style", "width: 30px; text-align: right;");
    input.defaultValue = "" + value;
    const update = () => {
        const value = Number(input.value);
        if (!isNaN(value)) useValue(value);
    };
    input.onblur = update;
    input.onkeydown = (event) => {
        if (event.code === "Enter") update();
    };

    wrapper.append(title, input);
    return wrapper;
};
