interface TextureBindEntry {
    type: "texture";
    view: GPUTextureView;
}

interface BufferBindEntry {
    type: "buffer";
    buffer: GPUBuffer;
    binding: GPUBufferBindingType;
}

export type BindEntry = TextureBindEntry | BufferBindEntry;

export class ComputeShader {
    pipeline: GPUComputePipeline;
    bind_group: GPUBindGroup;

    constructor(device: GPUDevice, code: string, entryPoint: string, bindings: BindEntry[]) {
        const bind_group_layout = device.createBindGroupLayout({
            entries: bindings.map((entry, idx) => ({
                binding: idx,
                visibility: GPUShaderStage.COMPUTE,
                buffer: entry.type === "buffer" ? { type: entry.binding } : undefined,
                storageTexture:
                    entry.type === "texture"
                        ? { access: "write-only", format: "rgba8unorm", viewDimension: "2d" }
                        : undefined,
            })),
        });

        this.bind_group = device.createBindGroup({
            layout: bind_group_layout,
            entries: bindings.map((entry, idx) => ({
                binding: idx,
                resource: entry.type === "texture" ? entry.view : { buffer: entry.buffer },
            })),
        });

        const pipeline_layout = device.createPipelineLayout({ bindGroupLayouts: [bind_group_layout] });
        this.pipeline = device.createComputePipeline({
            layout: pipeline_layout,
            compute: { module: device.createShaderModule({ code }), entryPoint },
        });
    }

    render = (commandEncoder: GPUCommandEncoder, x: number, y: number = 1, z: number = 1) => {
        const compute_pass = commandEncoder.beginComputePass();
        compute_pass.setPipeline(this.pipeline);
        compute_pass.setBindGroup(0, this.bind_group);
        compute_pass.dispatchWorkgroups(x, y, z);
        compute_pass.end();
    };
}
