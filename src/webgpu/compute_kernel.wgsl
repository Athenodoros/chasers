@group(0) @binding(0) var colour_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> timestamp: Timestamp;
@group(0) @binding(2) var<storage, read_write> chasers: ChaserData;

struct Timestamp {
    dt: f32,
}

struct Chaser {
    position: vec2<f32>,
    heading: f32,
}

struct ChaserData {
    chasers: array<Chaser>,
}

const background = vec4<f32>(10, 9, 26, 1);

@compute @workgroup_size(1,1,1)
fn draw_background(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_pos: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
    let pixel_colour: vec3<f32> = vec3<f32>(sin(timestamp.dt) * 0.5 + 0.5, 0.0, 0.25);

    // let previous = textureLoad(colour_buffer, screen_pos);

    // let alpha = pow(0.1, timestamp.dt);
    // let pixel_colour: vec4<f32> = alpha * previous + (1 - alpha) * background;

    textureStore(colour_buffer, screen_pos, vec4<f32>(pixel_colour, 1.0));
}

@compute @workgroup_size(1,1,1)
fn draw_points(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size = vec2<f32>(textureDimensions(colour_buffer));
    let id = i32(GlobalInvocationID.x);

    let angle = timestamp.dt / 4 + radians(f32(90 * id));
    chasers.chasers[id].position.x = screen_size.x / 2 + screen_size.y / 4 * sin(angle);
    chasers.chasers[id].position.y = screen_size.y / 2 + screen_size.y / 4 * cos(angle);

    for (var x: u32 = 0; x < 5; x++) {
        for (var y: u32 = 0; y < 5; y++) {
            let location = vec2<u32>(chasers.chasers[id].position) + vec2<u32>(x, y);
            textureStore(colour_buffer, location, vec4<f32>(vec3<f32>(0.5, 1.0, 0.75), 1.0));
        }
    }
}
