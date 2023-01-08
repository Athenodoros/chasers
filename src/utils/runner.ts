export interface Simulation {
    restart: () => void;
    update: (dt: number) => void;
    controls?: HTMLElement[];
}

export const runSimulationInLoop = (simulation: Simulation) => {
    const displayOuterDiv = document.getElementById("display") as HTMLDivElement;
    displayOuterDiv.setAttribute("style", "padding: 5px; background: #FFF9");
    const fpsDisplayDiv = document.createElement("div");
    if (simulation.controls) displayOuterDiv.append(fpsDisplayDiv, ...simulation.controls);
    else {
        const restartButton = document.createElement("button");
        restartButton.innerText = "Restart";
        restartButton.onclick = () => simulation.restart();
        displayOuterDiv.append(fpsDisplayDiv, restartButton);
    }

    let fps = 90;

    let previous = -1;
    const getAnimationFrame = (timestamp: number) => {
        // Update Time-Tracking
        if (previous < 0) previous = timestamp;
        else fps = fps * 0.95 + (1000 / (timestamp - previous)) * 0.05;
        fpsDisplayDiv.innerHTML = "FPS: " + Math.round(fps);

        const dt = Math.min((timestamp - previous) / 1000, 0.02);
        previous = timestamp;

        simulation.update(dt);

        // Re-Enter Loop
        window.requestAnimationFrame(getAnimationFrame);
    };

    window.requestAnimationFrame(getAnimationFrame);
};
