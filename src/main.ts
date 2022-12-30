import { CanvasSimulation } from "./canvas";
import "./style.css";
import { runSimulationInLoop } from "./utils/runner";

const simulation = new CanvasSimulation(2000, document.getElementById("canvas") as HTMLCanvasElement);
runSimulationInLoop(simulation);
(window as any).simulation = simulation;
