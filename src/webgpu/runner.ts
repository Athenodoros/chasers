import { ComputeShader } from "./computer";
import raytracer_kernel from "./raytracer_kernel.wgsl";
import { TextureRendererShader } from "./renderer";

export class Runner {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    context: GPUCanvasContext;

    computer: ComputeShader;
    texturer: TextureRendererShader;

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

        // Shader Handlers
        this.computer = new ComputeShader(
            this.device,
            raytracer_kernel,
            "main",
            [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d",
                    },
                },
            ],
            [{ binding: 0, resource: colour_buffer_view }]
        );

        this.texturer = new TextureRendererShader(this.device, colour_buffer_view);
    }

    render = () => {
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        this.computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        this.texturer.render(commandEncoder, this.context.getCurrentTexture().createView());

        this.device.queue.submit([commandEncoder.finish()]);
    };
}
