import { Runner } from "./runner";

export const runWebGPU = async (canvas: HTMLCanvasElement) => {
    canvas.width = 800;
    canvas.height = 600;

    const renderer = await Runner.from(canvas);

    const render = () => {
        renderer.render();
        requestAnimationFrame(render);
    };
    render();
};
