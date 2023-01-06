@group(0) @binding(0) var colour_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> timestamp: Timestamp;
@group(0) @binding(2) var<storage, read> chasers: ChaserData;

struct Sphere {
    center: vec3<f32>,
    radius: f32,
}

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

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

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // let screen_size: vec2<u32> = textureDimensions(colour_buffer);
    let screen_pos: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    // let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);
    // let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);
    // let forwards: vec3<f32> = vec3<f32>(1.0, 0.0, 0.0);
    // let right: vec3<f32> = vec3<f32>(0.0, -1.0, 0.0);
    // let up: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

    // var sphere: Sphere;
    // sphere.center = vec3<f32>(3.0, 0.0, 0.0);
    // sphere.radius = 1.0;
    
    // var ray: Ray;
    // ray.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
    // ray.origin = vec3<f32>(0.0, 0.0, 0.0);

    var pixel_colour: vec3<f32> = vec3<f32>(sin(timestamp.dt) * 0.5 + 0.5, 0.0, 0.25);

    for (var i: u32 = 0; i < 4; i++) {
        if (distance(vec2<f32>(GlobalInvocationID.xy), chasers.chasers[i].position) < 10) {
            pixel_colour = vec3<f32>(0.5, 1.0, 0.75);
        }
    }

    // if (hit(ray, sphere)) {
    //     pixel_colour = vec3<f32>(0.5, 1.0, 0.75);
    // }

    textureStore(colour_buffer, screen_pos, vec4<f32>(pixel_colour, 1.0));
}

fn hit(ray: Ray, sphere: Sphere) -> bool {
    let a: f32 = dot(ray.direction, ray.direction);
    let b: f32 = 2.0 * dot(ray.direction, ray.origin - sphere.center);
    let c: f32 = dot(ray.origin - sphere.center, ray.origin - sphere.center) - sphere.radius * sphere.radius;
    let discriminant: f32 = b * b - 4.0 * a * c;
    return discriminant > 0;
}
