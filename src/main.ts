// import { CanvasSimulation } from "./canvas";
import "./style.css";
import { runSimulationInLoop } from "./utils/runner";
import { WebGPUSimulation } from "./webgpu";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const simulation = await WebGPUSimulation.from(500_000, canvas);
runSimulationInLoop(simulation);
(window as any).simulation = simulation;
