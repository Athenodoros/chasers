import { BindEntry, ComputeShader } from "./computer";
import compute_kernel from "./compute_kernel.wgsl";
import { TextureRendererShader } from "./renderer";

export class Runner {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    context: GPUCanvasContext;

    chasers: number;

    background_computer: ComputeShader;
    chaser_computer: ComputeShader;
    draw_computer: ComputeShader;
    texturer: TextureRendererShader;

    uniformBuffer: GPUBuffer;

    static async from(canvas: HTMLCanvasElement, chasers: number = 1000) {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();

        if (!device) throw new Error("No GPU device found!");

        return new Runner(canvas, device, chasers);
    }

    constructor(canvas: HTMLCanvasElement, device: GPUDevice, chasers: number) {
        this.canvas = canvas;
        this.device = device;
        this.chasers = chasers;

        // Rendering Context
        const context = canvas.getContext("webgpu");
        if (!context) throw Error("No GPU context available");
        context.configure({ device, format: "bgra8unorm", alphaMode: "opaque" });
        this.context = context;

        // Assets
        const colourBufferView = getColourBufferView(device, canvas.width, canvas.height);

        this.uniformBuffer = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

        const chaserBuffer = device.createBuffer({
            size: 16 * chasers, // Blocks round up to multiple of 16 (from 2 * 4 + 4)
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        const chaserArray = new Float32Array(4 * chasers);
        for (let idx of [...Array(chasers).keys()]) {
            chaserArray[idx * 4] = canvas.width / 2 + ((Math.random() - 0.5) * canvas.height) / 2;
            chaserArray[idx * 4 + 1] = canvas.height / 2 + ((Math.random() - 0.5) * canvas.height) / 2;
            chaserArray[idx * 4 + 2] = Math.random() * Math.PI * 2;
            chaserArray[idx * 4 + 3] = 0.0; // Pad out block of 16 to match struct array layout
        }
        device.queue.writeBuffer(chaserBuffer, 0, chaserArray);

        const valueBuffer = device.createBuffer({
            size: 4 * canvas.width * canvas.height * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(
            valueBuffer,
            0,
            new Float32Array([...Array(4 * canvas.width * canvas.height).map(() => 0.0)])
        );

        const bindings: BindEntry[] = [
            { type: "texture", view: colourBufferView },
            { type: "buffer", buffer: this.uniformBuffer, binding: "uniform" },
            { type: "buffer", buffer: chaserBuffer, binding: "storage" },
            { type: "buffer", buffer: valueBuffer, binding: "storage" },
        ];

        // Shader Handlers
        this.background_computer = new ComputeShader(device, compute_kernel, "fade_values", bindings);
        this.chaser_computer = new ComputeShader(device, compute_kernel, "update_and_draw_points", bindings);
        this.draw_computer = new ComputeShader(device, compute_kernel, "draw_to_texture", bindings);
        this.texturer = new TextureRendererShader(device, colourBufferView);
    }

    time: number = new Date().valueOf();

    render = (dt: number) => {
        this.time += dt * 1000;

        const array = new Float32Array([dt, this.time]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, array);

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        this.background_computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        this.chaser_computer.render(commandEncoder, this.chasers);
        this.draw_computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        this.texturer.render(commandEncoder, this.context.getCurrentTexture().createView());

        this.device.queue.submit([commandEncoder.finish()]);
    };
}

const getColourBufferView = (device: GPUDevice, width: number, height: number) => {
    const colour_buffer = device.createTexture({
        size: { width, height },
        format: "rgba8unorm",
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    return colour_buffer.createView();
};
