export function getFloat32Buffer(device: GPUDevice, usage: number, values: number[] | Float32Array): GPUBuffer;
export function getFloat32Buffer(
    device: GPUDevice,
    usage: number,
    length: number,
    values?: (index: number) => number
): GPUBuffer;
export function getFloat32Buffer(
    device: GPUDevice,
    usage: number,
    lengthOrValues: number | number[] | Float32Array,
    getValues?: (index: number) => number
): GPUBuffer {
    const length = typeof lengthOrValues === "number" ? lengthOrValues : lengthOrValues.length;
    const buffer = device.createBuffer({ size: length * 4, usage });

    let array: Float32Array;
    if (lengthOrValues instanceof Float32Array) array = lengthOrValues;
    else {
        array = new Float32Array(length);
        if (Array.isArray(lengthOrValues)) for (let idx = 0; idx < length; idx++) array[idx] = lengthOrValues[idx];
        else if (getValues) for (let idx = 0; idx < length; idx++) array[idx] = getValues(idx);
    }
    device.queue.writeBuffer(buffer, 0, array);

    return buffer;
}

export const getTextureView = (device: GPUDevice, width: number, height: number) => {
    const colour_buffer = device.createTexture({
        size: { width, height },
        format: "rgba8unorm",
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    return colour_buffer.createView();
};
