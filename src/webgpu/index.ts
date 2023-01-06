import { Runner } from "./runner";

export const runWebGPU = async (canvas: HTMLCanvasElement) => {
    canvas.width = 800;
    canvas.height = 600;

    const renderer = await Runner.from(canvas);

    let previous = new Date().valueOf();
    const render = () => {
        let next = new Date().valueOf();
        renderer.render(next - previous);
        previous = next;

        requestAnimationFrame(render);
    };
    render();
};
