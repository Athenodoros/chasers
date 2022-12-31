import { Renderer } from "./renderer";

export const runWebGPU = async (canvas: HTMLCanvasElement) => {
    canvas.width = 800;
    canvas.height = 600;

    const renderer = new Renderer(canvas);
    await renderer.Initialize();
};
