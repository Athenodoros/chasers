import raytracer_kernel from "./raytracer_kernel.wgsl";
import screen_shader from "./screen_shader.wgsl";

// Mostly copied from https://www.youtube.com/watch?v=Gv0EiQfDI7w&list=PLn3eTxaOtL2Ns3wkxdyS3CiqkJuwQdZzn&index=12
export class Renderer {
    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Assets
    colour_buffer!: GPUTexture;
    colour_buffer_view!: GPUTextureView;
    sampler!: GPUSampler;

    // Shader Handlers
    computer!: ComputeShader;
    texturer!: TextureRendererShader;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize() {
        await this.setupDevice();
        await this.createAssets();
        this.initialiseShaderHandlers();
        this.render();
    }

    async setupDevice() {
        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice>await this.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque",
        });
    }

    initialiseShaderHandlers() {
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
            [{ binding: 0, resource: this.colour_buffer_view }]
        );

        this.texturer = new TextureRendererShader(
            this.device,
            [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
            ],
            [
                { binding: 0, resource: this.sampler },
                { binding: 1, resource: this.colour_buffer_view },
            ]
        );
    }

    async createAssets() {
        this.colour_buffer = this.device.createTexture({
            size: { width: this.canvas.width, height: this.canvas.height },
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.colour_buffer_view = this.colour_buffer.createView();

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1,
        };
        this.sampler = this.device.createSampler(samplerDescriptor);
    }

    render = () => {
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();

        this.computer.render(commandEncoder, this.canvas.width, this.canvas.height);

        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        this.texturer.render(commandEncoder, textureView);

        this.device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(this.render);
    };
}

class ComputeShader {
    pipeline: GPUComputePipeline;
    bind_group: GPUBindGroup;

    constructor(
        device: GPUDevice,
        code: string,
        entryPoint: string,
        layouts: Iterable<GPUBindGroupLayoutEntry>,
        entries: Iterable<GPUBindGroupEntry>
    ) {
        const bind_group_layout = device.createBindGroupLayout({ entries: layouts });
        this.bind_group = device.createBindGroup({ layout: bind_group_layout, entries });

        const pipeline_layout = device.createPipelineLayout({ bindGroupLayouts: [bind_group_layout] });
        this.pipeline = device.createComputePipeline({
            layout: pipeline_layout,
            compute: { module: device.createShaderModule({ code }), entryPoint },
        });
    }

    render = (commandEncoder: GPUCommandEncoder, x: number, y: number, z: number = 1) => {
        const compute_pass = commandEncoder.beginComputePass();
        compute_pass.setPipeline(this.pipeline);
        compute_pass.setBindGroup(0, this.bind_group);
        compute_pass.dispatchWorkgroups(x, y, z);
        compute_pass.end();
    };
}

class TextureRendererShader {
    pipeline: GPURenderPipeline;
    bind_group: GPUBindGroup;

    constructor(device: GPUDevice, layouts: Iterable<GPUBindGroupLayoutEntry>, entries: Iterable<GPUBindGroupEntry>) {
        const bind_group_layout = device.createBindGroupLayout({ entries: layouts });
        this.bind_group = device.createBindGroup({ layout: bind_group_layout, entries });

        const pipeline_layout = device.createPipelineLayout({ bindGroupLayouts: [bind_group_layout] });
        this.pipeline = device.createRenderPipeline({
            layout: pipeline_layout,
            vertex: {
                module: device.createShaderModule({ code: screen_shader }),
                entryPoint: "vert_main",
            },
            fragment: {
                module: device.createShaderModule({ code: screen_shader }),
                entryPoint: "frag_main",
                targets: [{ format: "bgra8unorm" }],
            },
            primitive: {
                topology: "triangle-list",
            },
        });
    }

    render = (commandEncoder: GPUCommandEncoder, textureView: GPUTextureView) => {
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: textureView, loadOp: "clear", storeOp: "store" }],
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setBindGroup(0, this.bind_group);
        renderpass.draw(6, 1, 0, 0);
        renderpass.end();
    };
}
