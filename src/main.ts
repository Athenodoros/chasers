// import { CanvasSimulation } from "./canvas";
import "./style.css";
// import { runSimulationInLoop } from "./utils/runner";
import { runWebGPU } from "./webgpu";

// const simulation = new CanvasSimulation(2000, document.getElementById("canvas") as HTMLCanvasElement);
// runSimulationInLoop(simulation);
// (window as any).simulation = simulation;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
runWebGPU(canvas);
