import { Renderer } from "./renderer";
import { ChaserSimulation } from "./simulation";
import "./style.css";

const fpsDisplayDiv = document.getElementById("fps")!;
let fps = 0;

const renderer = new Renderer();
const simulation = new ChaserSimulation(renderer.viewport);
renderer.updateCanvasFrame(0, simulation.list);

let previous = -1;
const getAnimationFrame = (timestamp: number) => {
    // Update Time-Tracking
    if (previous < 0) previous = timestamp;
    else fps = fps * 0.95 + (1000 / (timestamp - previous)) * 0.05;
    fpsDisplayDiv.innerHTML = "" + Math.round(fps);

    const dt = Math.min((timestamp - previous) / 1000, 0.02);
    previous = timestamp;

    simulation.update(dt, renderer.getImageData(), renderer.dpr);
    renderer.updateCanvasFrame(dt, simulation.list);

    // Re-Enter Loop
    window.requestAnimationFrame(getAnimationFrame);
};

window.requestAnimationFrame(getAnimationFrame);

// Debugging
(window as any).renderer = renderer;
(window as any).simulation = simulation;
