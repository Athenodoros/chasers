export const runSimulationInLoop = (simulation: { update: (dt: number) => void }) => {
    const fpsDisplayDiv = document.getElementById("display") as HTMLDivElement;
    let fps = 0;

    let previous = -1;
    const getAnimationFrame = (timestamp: number) => {
        // Update Time-Tracking
        if (previous < 0) previous = timestamp;
        else fps = fps * 0.95 + (1000 / (timestamp - previous)) * 0.05;
        fpsDisplayDiv.innerHTML = "" + Math.round(fps);

        const dt = Math.min((timestamp - previous) / 1000, 0.02);
        previous = timestamp;

        simulation.update(dt);

        // Re-Enter Loop
        window.requestAnimationFrame(getAnimationFrame);
    };

    window.requestAnimationFrame(getAnimationFrame);
};
