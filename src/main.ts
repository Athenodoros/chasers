import { Renderer } from "./renderer";
import { ChaserSimulation } from "./simulation";
import "./style.css";

const renderer = new Renderer();
const simulation = new ChaserSimulation(renderer.viewport);
renderer.updateCanvasFrame(0, simulation.list);

let previous = -1;
const getAnimationFrame = (timestamp: number) => {
    // Update Time-Tracking
    if (previous < 0) previous = timestamp;
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
