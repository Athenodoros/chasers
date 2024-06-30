import compute_kernel from "./compute_kernel.wgsl";
import { getFloat32Buffer, getTextureView } from "./utils/buffers";
import { ComputeShaderRunner } from "./utils/compute";
import { TextureRendererShader } from "./utils/renderer";

export class Runner {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    context: GPUCanvasContext;

    chasers: number;

    background_computer: ComputeShaderRunner;
    chaser_computer: ComputeShaderRunner;
    draw_computer: ComputeShaderRunner;
    texturer: TextureRendererShader;

    sceneBuffer: GPUBuffer;

    static async from(
        canvas: HTMLCanvasElement,
        thousands: number,
        acceleration: number,
        velocity: number,
        sensor: number,
        range: number,
        halflife: number
    ) {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();

        if (!device) throw new Error("No GPU device found!");

        return new Runner(canvas, device, thousands * 1000, acceleration, velocity, sensor, range, halflife);
    }

    private constructor(
        canvas: HTMLCanvasElement,
        device: GPUDevice,
        chasers: number,
        acceleration: number,
        velocity: number,
        sensor: number,
        range: number,
        halflife: number
    ) {
        this.canvas = canvas;
        this.device = device;
        this.chasers = chasers;

        // Rendering Context
        const context = canvas.getContext("webgpu");
        if (!context) throw Error("No GPU context available");
        context.configure({ device, format: "bgra8unorm", alphaMode: "opaque" });
        this.context = context;

        // Assets
        const colourBufferView = getTextureView(device, canvas.width, canvas.height);

        const scene = [0, 0, canvas.width, canvas.height, acceleration, velocity, sensor, range, halflife];
        this.sceneBuffer = getFloat32Buffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, scene);

        const chaserBuffer = getFloat32Buffer(
            device,
            GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            [...Array(chasers)].flatMap(() => {
                const r = Math.sqrt(Math.random()) * Math.min(canvas.height, canvas.width) * 0.4;
                const theta = Math.random() * Math.PI * 2;

                return [
                    canvas.width / 2 + r * Math.sin(theta),
                    canvas.height / 2 + r * Math.cos(theta),
                    (Math.PI + theta) % (Math.PI * 2),
                    0, // Blocks round up to multiple of 16 bytes (from 2 * 4 + 4 = 12 in the Chaser struct )
                ];
            })
        );

        const valueBuffer = getFloat32Buffer(
            device,
            GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            canvas.width * canvas.height * 4
        );

        const bindings: ComputeShaderRunner.Binding[] = [
            { type: "texture", view: colourBufferView },
            { type: "buffer", buffer: this.sceneBuffer, binding: "uniform" },
            { type: "buffer", buffer: chaserBuffer, binding: "storage" },
            { type: "buffer", buffer: valueBuffer, binding: "storage" },
        ];

        // Shader Handlers
        this.background_computer = new ComputeShaderRunner(device, compute_kernel, "fade_values", bindings);
        this.chaser_computer = new ComputeShaderRunner(device, compute_kernel, "update_and_draw_points", bindings);
        this.draw_computer = new ComputeShaderRunner(device, compute_kernel, "draw_to_texture", bindings);
        this.texturer = new TextureRendererShader(device, colourBufferView);
    }

    private time: number = new Date().valueOf();

    render = (dt: number) => {
        this.time += dt * 1000;
        this.writeSceneValue(0, dt, this.time);

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        this.background_computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        this.chaser_computer.render(commandEncoder, this.chasers / 1000, 1000);
        this.draw_computer.render(commandEncoder, this.canvas.width, this.canvas.height);
        this.texturer.render(commandEncoder, this.context.getCurrentTexture().createView());
        this.device.queue.submit([commandEncoder.finish()]);
    };

    private writeSceneValue = (index: number, ...values: number[]) =>
        this.device.queue.writeBuffer(this.sceneBuffer, index, new Float32Array(values));

    setAcceleration = (value: number) => this.writeSceneValue(16, value);
    setVelocity = (value: number) => this.writeSceneValue(20, value);
    setSensor = (value: number) => this.writeSceneValue(24, value);
    setRange = (value: number) => this.writeSceneValue(28, value);
    setHalflife = (value: number) => this.writeSceneValue(32, value);
}
