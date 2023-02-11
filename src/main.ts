// import { CanvasSimulation } from "./canvas";
import "./style.css";
import { runSimulationInLoop } from "./utils/runner";
import { WebGPUSimulation } from "./webgpu";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// const simulation = new CanvasSimulation(2000, canvas);
WebGPUSimulation.from(400_000, canvas).then((simulation) => {
    runSimulationInLoop(simulation);
    (window as any).simulation = simulation;
});
