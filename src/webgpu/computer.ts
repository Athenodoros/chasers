export class ComputeShader {
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

    render = (commandEncoder: GPUCommandEncoder, x: number, y: number = 1, z: number = 1) => {
        const compute_pass = commandEncoder.beginComputePass();
        compute_pass.setPipeline(this.pipeline);
        compute_pass.setBindGroup(0, this.bind_group);
        compute_pass.dispatchWorkgroups(x, y, z);
        compute_pass.end();
    };
}
