import { ComputeShader } from "./computer";
import compute_kernel from "./compute_kernel.wgsl";
import { TextureRendererShader } from "./renderer";

export class Runner {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    context: GPUCanvasContext;

    background_computer: ComputeShader;
    chaser_computer: ComputeShader;
    texturer: TextureRendererShader;

    uniformBuffer: GPUBuffer;

    static async from(canvas: HTMLCanvasElement) {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();

        if (!device) throw new Error("No GPU device found!");

        return new Runner(canvas, device);
    }

    constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
        this.canvas = canvas;
        this.device = device;

        // Rendering Context
        const context = canvas.getContext("webgpu");
        if (!context) throw Error("No GPU context available");
        context.configure({ device, format: "bgra8unorm", alphaMode: "opaque" });
        this.context = context;

        // Colour Buffer
        const colour_buffer = this.device.createTexture({
            size: { width: this.canvas.width, height: this.canvas.height },
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        const colour_buffer_view = colour_buffer.createView();
        this.uniformBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const chaserBuffer = this.device.createBuffer({
            size: 16 * 4, // Blocks round up to multiple of 16 (from 2 * 4 + 4), 4 chasers to start
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(
            chaserBuffer,
            0,
            new Float32Array([
                canvas.width / 2 + canvas.height / 4,
                canvas.height / 2,
                0.0,
                0.0,
                canvas.width / 2,
                canvas.height / 2 + canvas.height / 4,
                0.0,
                0.0,
                canvas.width / 2 - canvas.height / 4,
                canvas.height / 2,
                0.0,
                0.0,
                canvas.width / 2,
                canvas.height / 2 - canvas.height / 4,
                0.0,
                0.0,
            ])
        );

        // Shader Handlers
        this.background_computer = new ComputeShader(this.device, compute_kernel, "draw_background", [
            { type: "texture", view: colour_buffer_view },
            { type: "buffer", buffer: this.uniformBuffer, binding: "uniform" },
            { type: "buffer", buffer: chaserBuffer, binding: "storage" },
        ]);

        this.chaser_computer = new ComputeShader(this.device, compute_kernel, "draw_points", [
            { type: "texture", view: colour_buffer_view },
            { type: "buffer", buffer: this.uniformBuffer, binding: "uniform" },
            { type: "buffer", buffer: chaserBuffer, binding: "storage" },
        ]);

        this.texturer = new TextureRendererShader(this.device, colour_buffer_view);
    }

    render = (dt: number) => {
        const array = new Float32Array([dt / 1000]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, array);

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        this.background_computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        // this.chaser_computer.render(commandEncoder, 4);
        this.texturer.render(commandEncoder, this.context.getCurrentTexture().createView());

        this.device.queue.submit([commandEncoder.finish()]);
    };
}
