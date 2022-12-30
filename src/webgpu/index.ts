import shader from "./shaders.wgsl";

export const runWebGPU = async (canvas: HTMLCanvasElement) => {
    canvas.style.width = "800px";
    canvas.style.height = "600px";

    const adapter = (await navigator.gpu.requestAdapter())!;
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu")!;
    const format: GPUTextureFormat = "bgra8unorm";
    context.configure({
        device,
        format,
        alphaMode: "opaque",
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [],
    });
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [],
    });
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
    });

    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: shader,
            }),
            entryPoint: "vs_main",
        },

        fragment: {
            module: device.createShaderModule({
                code: shader,
            }),
            entryPoint: "fs_main",
            targets: [{ format }],
        },

        primitive: {
            topology: "triangle-list",
        },

        layout: pipelineLayout,
    });

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.5, g: 0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
            },
        ],
    });
    renderpass.setPipeline(pipeline);
    renderpass.setBindGroup(0, bindGroup);
    renderpass.draw(3, 1, 0, 0);
    renderpass.end();

    device.queue.submit([commandEncoder.finish()]);
};
