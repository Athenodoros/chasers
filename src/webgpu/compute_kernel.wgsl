@group(0) @binding(0) var colour_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> timestamp: Timestamp;
@group(0) @binding(2) var<storage, read_write> chasers: ChaserData;
@group(0) @binding(3) var<storage, read_write> values: ValueData;

struct Timestamp {
    dt: f32,
    time: f32,
}

struct Chaser {
    position: vec2<f32>,
    heading: f32,
}
struct ChaserData {
    chasers: array<Chaser>,
}

struct ValueData {
    values: array<f32>,
}

const background = vec4<f32>(10.0 / 255, 9.0 / 255, 26.0 / 255, 1);
const foreground = vec4<f32>(224.0 / 255, 231.0 / 255, 255.0 / 255, 1);

@compute @workgroup_size(1,1,1)
fn fade_values(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let point = GlobalInvocationID.xy;
    var value = get_value_at_point(point);
    put_value_at_point(value * alpha(), point);
}

const acc = 2;
const velocity = 20;

@compute @workgroup_size(1,1,1)
fn update_and_draw_points(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size = textureDimensions(colour_buffer);
    let id = i32(GlobalInvocationID.x * 1000 + GlobalInvocationID.y);

    let left = sample_data_at_location(
        chasers.chasers[id].position.x + 10 * sin(chasers.chasers[id].heading - radians(60)),
        chasers.chasers[id].position.y + 10 * cos(chasers.chasers[id].heading - radians(60))
    );
    let center = sample_data_at_location(
        chasers.chasers[id].position.x + 10 * sin(chasers.chasers[id].heading),
        chasers.chasers[id].position.y + 10 * cos(chasers.chasers[id].heading)
    );
    let right = sample_data_at_location(
        chasers.chasers[id].position.x + 10 * sin(chasers.chasers[id].heading + radians(60)),
        chasers.chasers[id].position.y + 10 * cos(chasers.chasers[id].heading + radians(60))
    );

    if (center >= left && center >= right) {
        chasers.chasers[id].heading += (prng(GlobalInvocationID.x, chasers.chasers[id].position) * 0.4 - 0.2) * acc * timestamp.dt;
    } else if (left >= center && left >= right) {
        chasers.chasers[id].heading -= (prng(GlobalInvocationID.x, chasers.chasers[id].position) * 0.4 + 0.8) * acc * timestamp.dt;
    } else if (right >= center && right >= left) {
        chasers.chasers[id].heading += (prng(GlobalInvocationID.x, chasers.chasers[id].position) * 0.4 + 0.8) * acc * timestamp.dt;
    }

    chasers.chasers[id].position.x += velocity * timestamp.dt * sin(chasers.chasers[id].heading);
    chasers.chasers[id].position.y += velocity * timestamp.dt * cos(chasers.chasers[id].heading);

    if (chasers.chasers[id].position.x < 0.0) {
        chasers.chasers[id].position.x = 0.0;
    }
    if (chasers.chasers[id].position.x > f32(screen_size.x)) {
        chasers.chasers[id].position.x = f32(screen_size.x);
    }
    if (chasers.chasers[id].position.y < 0.0) {
        chasers.chasers[id].position.y = 0.0;
    }
    if (chasers.chasers[id].position.y > f32(screen_size.y)) {
        chasers.chasers[id].position.y = f32(screen_size.y);
    }

    put_value_at_point(1.0, vec2<u32>(chasers.chasers[id].position));
}

@compute @workgroup_size(1,1,1)
fn draw_to_texture(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let value = get_value_at_point(GlobalInvocationID.xy);
    let colour = value * foreground + (1.0 - value) * background;
    textureStore(colour_buffer, vec2<u32>(GlobalInvocationID.x, textureDimensions(colour_buffer).y - GlobalInvocationID.y), colour);
}

// Helpers

fn put_value_at_point(value: f32, point: vec2<u32>) {
    values.values[get_index_of_point(point)] = value;
}

fn get_value_at_point(point: vec2<u32>) -> f32 {
    return values.values[get_index_of_point(point)];
}

fn get_index_of_point(point: vec2<u32>) -> u32 {
    let width = textureDimensions(colour_buffer).x;
    return (point.y * width) + point.x;
}

fn alpha() -> f32 {
    return pow(0.99, timestamp.dt * 200);
}

fn radial(r: f32, angle: f32) -> vec2<f32> {
    return vec2<f32>(r * cos(angle), r * sin(angle));
}

const a = 75.0;
const m = 65537.0;
fn prng(id: u32, point: vec2<f32>) -> f32 {
    var x = a;
    x = x * timestamp.time % m;
    x = x * f32(id + 1) % m;
    x = x * point.x % m;
    x = x * point.y % m;
    return x % 1000 / 1000;
}

const range: f32 = 5.0;
fn sample_data_at_location(xf: f32, yf: f32) -> f32 {
    var total = 0.0;

    for (var dx: f32 = -range; dx <= range; dx += 1.0) {
        for (var dy: f32 = -range; dy <= range; dy += 1.0) {
            if (
                xf + dx < 0 ||
                xf + dx >= f32(textureDimensions(colour_buffer).x) ||
                yf + dy < 0 ||
                yf + dy >= f32(textureDimensions(colour_buffer).y)
            ) {
                total -= 10.0;
            } else {
                total += max(0.0, get_value_at_point(vec2<u32>(u32(xf + dx), u32(yf + dy))));
            }
        }
    }

    let count = pow(f32(2 * range + 1), 2.0);
    return total / count;
}
