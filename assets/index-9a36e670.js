var S=Object.defineProperty;var T=(c,e,t)=>e in c?S(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var a=(c,e,t)=>(T(c,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerpolicy&&(r.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?r.credentials="include":n.crossorigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const B=c=>{const e=document.getElementById("display");e.setAttribute("style","padding: 5px; background: #FFF9");const t=document.createElement("div");if(c.controls)e.append(t,...c.controls);else{const s=document.createElement("button");s.innerText="Restart",s.onclick=()=>c.restart(),e.append(t,s)}let i=90,n=-1;const r=s=>{n<0?n=s:i=i*.95+1e3/(s-n)*.05,t.innerHTML="FPS: "+Math.round(i);const o=Math.min((s-n)/1e3,.02);n=s,c.update(o),window.requestAnimationFrame(r)};window.requestAnimationFrame(r)};var y=`@group(0) @binding(0) var colour_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> scene: Scene;
@group(0) @binding(2) var<storage, read_write> chasers: ChaserData;
@group(0) @binding(3) var<storage, read_write> values: ValueData;

struct Scene {
    dt: f32,
    time: f32,
    width: f32,
    height: f32,
    acc: f32,
    velocity: f32,
    sensor: f32,
    range: f32,
    halflife: f32,
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
    if (value < 0.001) {
        value = 0;
    }
    put_value_at_point(value * alpha(), point);
}

@compute @workgroup_size(1,1,1)
fn update_and_draw_points(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let id = i32(GlobalInvocationID.x * 1000 + GlobalInvocationID.y);

    let left = sample_data_at_location(
        chasers.chasers[id].position.x + scene.sensor * sin(chasers.chasers[id].heading - radians(60)),
        chasers.chasers[id].position.y + scene.sensor * cos(chasers.chasers[id].heading - radians(60))
    );
    let center = sample_data_at_location(
        chasers.chasers[id].position.x + scene.sensor * sin(chasers.chasers[id].heading),
        chasers.chasers[id].position.y + scene.sensor * cos(chasers.chasers[id].heading)
    );
    let right = sample_data_at_location(
        chasers.chasers[id].position.x + scene.sensor * sin(chasers.chasers[id].heading + radians(60)),
        chasers.chasers[id].position.y + scene.sensor * cos(chasers.chasers[id].heading + radians(60))
    );

    if (center >= left && center >= right) {
        chasers.chasers[id].heading += (prng(GlobalInvocationID.x, u32(scene.dt)) * 0.4 - 0.2) * scene.acc * scene.dt;
    }
    else if (left >= center && left >= right) {
        chasers.chasers[id].heading -= (prng(GlobalInvocationID.x, u32(scene.dt)) * 0.4 + 0.8) * scene.acc * scene.dt;
    } else if (right >= center && right >= left) {
        chasers.chasers[id].heading += (prng(GlobalInvocationID.x, u32(scene.dt)) * 0.4 + 0.8) * scene.acc * scene.dt;
    }

    chasers.chasers[id].position.x += scene.velocity * scene.dt * sin(chasers.chasers[id].heading);
    chasers.chasers[id].position.y += scene.velocity * scene.dt * cos(chasers.chasers[id].heading);

    if (chasers.chasers[id].position.x < 0.0) {
        chasers.chasers[id].position.x = 0.0;
    }
    if (chasers.chasers[id].position.x > scene.width) {
        chasers.chasers[id].position.x = scene.width;
    }
    if (chasers.chasers[id].position.y < 0.0) {
        chasers.chasers[id].position.y = 0.0;
    }
    if (chasers.chasers[id].position.y > scene.height) {
        chasers.chasers[id].position.y = scene.height;
    }

    put_value_at_point(1.0, vec2<u32>(chasers.chasers[id].position));
}

@compute @workgroup_size(1,1,1)
fn draw_to_texture(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let value = get_value_at_point(GlobalInvocationID.xy);
    let colour = value * foreground + (1.0 - value) * background;
    textureStore(colour_buffer, vec2<u32>(GlobalInvocationID.x, u32(scene.height) - GlobalInvocationID.y), colour);
}

fn put_value_at_point(value: f32, point: vec2<u32>) {
    values.values[get_index_of_point(point)] = value;
}

fn get_value_at_point(point: vec2<u32>) -> f32 {
    return values.values[get_index_of_point(point)];
}

fn get_index_of_point(point: vec2<u32>) -> u32 {
    return (point.y * u32(scene.width)) + point.x;
}

fn alpha() -> f32 {
    return pow(scene.halflife, scene.dt);
}

fn radial(r: f32, angle: f32) -> vec2<f32> {
    return vec2<f32>(r * cos(angle), r * sin(angle));
}

const max_u32 = f32(4294967296); 
fn prng(id1: u32, id2: u32) -> f32 {
    return f32(hash(hash(id1) * id2)) / max_u32;
}
fn hash(state: u32) -> u32 {
    var result = state;
    result ^= 2747636419;
    result *= 2654435769;
    result ^= result >> 16;
    result *= 2654435769;
    result ^= result >> 16;
    result *= 2654435769;
    return result;
}

fn sample_data_at_location(xf: f32, yf: f32) -> f32 {
    var total = 0.0;

    for (var dx: f32 = -scene.range; dx <= scene.range; dx += 1.0) {
        for (var dy: f32 = -scene.range; dy <= scene.range; dy += 1.0) {
            if (
                xf + dx < 0 ||
                xf + dx >= scene.width ||
                yf + dy < 0 ||
                yf + dy >= scene.height
            ) {
                total -= 10.0;
            } else {
                total += max(0.0, get_value_at_point(vec2<u32>(u32(xf + dx), u32(yf + dy))));
            }
        }
    }

    let count = pow(f32(2 * scene.range + 1), 2.0);
    return total / count;
}`;function b(c,e,t,i){const n=typeof t=="number"?t:t.length,r=c.createBuffer({size:n*4,usage:e});let s;if(t instanceof Float32Array)s=t;else if(s=new Float32Array(n),Array.isArray(t))for(let o=0;o<n;o++)s[o]=t[o];else if(i)for(let o=0;o<n;o++)s[o]=i(o);return c.queue.writeBuffer(r,0,s),r}const D=(c,e,t)=>c.createTexture({size:{width:e,height:t},format:"rgba8unorm",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}).createView();class v{constructor(e,t,i,n){a(this,"pipeline");a(this,"bind_group");a(this,"render",(e,t,i=1,n=1)=>{const r=e.beginComputePass();r.setPipeline(this.pipeline),r.setBindGroup(0,this.bind_group),r.dispatchWorkgroups(t,i,n),r.end()});const r=e.createBindGroupLayout({entries:n.map((o,l)=>({binding:l,visibility:GPUShaderStage.COMPUTE,buffer:o.type==="buffer"?{type:o.binding}:void 0,storageTexture:o.type==="texture"?{access:"write-only",format:"rgba8unorm",viewDimension:"2d"}:void 0}))});this.bind_group=e.createBindGroup({layout:r,entries:n.map((o,l)=>({binding:l,resource:o.type==="texture"?o.view:{buffer:o.buffer}}))});const s=e.createPipelineLayout({bindGroupLayouts:[r]});this.pipeline=e.createComputePipeline({layout:s,compute:{module:e.createShaderModule({code:t}),entryPoint:i}})}}var G=`@group(0) @binding(0) var screen_sampler: sampler;
@group(0) @binding(1) var colour_buffer: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) TexCoord: vec2<f32>,
}

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
    let positions = array<vec2<f32>, 6>(
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
    );

    let texCoords = array<vec2<f32>, 6>(
        vec2<f32>(1.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(0.0, 0.0),
    );

    var output: VertexOutput;
    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);
    output.TexCoord = texCoords[VertexIndex];
    return output;
}

@fragment
fn frag_main(@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(colour_buffer, screen_sampler, TexCoord);
}`;class U{constructor(e,t){a(this,"pipeline");a(this,"bind_group");a(this,"render",(e,t)=>{const i=e.beginRenderPass({colorAttachments:[{view:t,loadOp:"clear",storeOp:"store"}]});i.setPipeline(this.pipeline),i.setBindGroup(0,this.bind_group),i.draw(6,1,0,0),i.end()});const i={addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1},n=e.createSampler(i),r=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}}]});this.bind_group=e.createBindGroup({layout:r,entries:[{binding:0,resource:n},{binding:1,resource:t}]});const s=e.createPipelineLayout({bindGroupLayouts:[r]});this.pipeline=e.createRenderPipeline({layout:s,vertex:{module:e.createShaderModule({code:G}),entryPoint:"vert_main"},fragment:{module:e.createShaderModule({code:G}),entryPoint:"frag_main",targets:[{format:"bgra8unorm"}]},primitive:{topology:"triangle-list"}})}}class g{constructor(e,t,i,n,r,s,o,l){a(this,"canvas");a(this,"device");a(this,"context");a(this,"chasers");a(this,"background_computer");a(this,"chaser_computer");a(this,"draw_computer");a(this,"texturer");a(this,"sceneBuffer");a(this,"time",new Date().valueOf());a(this,"render",e=>{this.time+=e*1e3,this.writeSceneValue(0,e,this.time);const t=this.device.createCommandEncoder();this.background_computer.render(t,this.canvas.width,this.canvas.height),this.chaser_computer.render(t,this.chasers/1e3,1e3),this.draw_computer.render(t,this.canvas.width,this.canvas.height),this.texturer.render(t,this.context.getCurrentTexture().createView()),this.device.queue.submit([t.finish()])});a(this,"writeSceneValue",(e,...t)=>this.device.queue.writeBuffer(this.sceneBuffer,e,new Float32Array(t)));a(this,"setAcceleration",e=>this.writeSceneValue(16,e));a(this,"setVelocity",e=>this.writeSceneValue(20,e));a(this,"setSensor",e=>this.writeSceneValue(24,e));a(this,"setRange",e=>this.writeSceneValue(28,e));a(this,"setHalflife",e=>this.writeSceneValue(32,e));this.canvas=e,this.device=t,this.chasers=i;const d=e.getContext("webgpu");if(!d)throw Error("No GPU context available");d.configure({device:t,format:"bgra8unorm",alphaMode:"opaque"}),this.context=d;const h=D(t,e.width,e.height),f=[0,0,e.width,e.height,n,r,s,o,l];this.sceneBuffer=b(t,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,f);const u=b(t,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,[...Array(i)].flatMap(()=>{const w=Math.sqrt(Math.random())*Math.min(e.height,e.width)*.4,_=Math.random()*Math.PI*2;return[e.width/2+w*Math.sin(_),e.height/2+w*Math.cos(_),(Math.PI+_)%(Math.PI*2),0]})),P=b(t,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,e.width*e.height*4),m=[{type:"texture",view:h},{type:"buffer",buffer:this.sceneBuffer,binding:"uniform"},{type:"buffer",buffer:u,binding:"storage"},{type:"buffer",buffer:P,binding:"storage"}];this.background_computer=new v(t,y,"fade_values",m),this.chaser_computer=new v(t,y,"update_and_draw_points",m),this.draw_computer=new v(t,y,"draw_to_texture",m),this.texturer=new U(t,h)}static async from(e,t,i,n,r,s,o){var h;const l=await((h=navigator.gpu)==null?void 0:h.requestAdapter()),d=await(l==null?void 0:l.requestDevice());if(!d)throw new Error("No GPU device found!");return new g(e,d,t*1e3,i,n,r,s,o)}}class x{constructor(e,t,i,n,r,s,o,l){a(this,"canvas");a(this,"chasers");a(this,"controls");a(this,"acceleration");a(this,"velocity");a(this,"sensor");a(this,"range");a(this,"halflife");a(this,"runner");this.runner=e,this.canvas=t,this.chasers=i,this.acceleration=n,this.velocity=r,this.sensor=s,this.range=o,this.halflife=l;const d=document.createElement("div");d.setAttribute("style","display: flex");const h=document.createElement("input");h.setAttribute("style","flex-shrink: 1; min-width: 0;"),h.defaultValue=""+i;const f=document.createElement("button");f.innerText="Restart",f.onclick=()=>{const u=Number(h.value||i);u&&!isNaN(u)&&(this.chasers=u,this.restart())},d.append(h,f),this.controls=[d,p("Acceleration",n,u=>{this.acceleration=u,this.runner.setAcceleration(u)}),p("Velocity",r,u=>{this.velocity=u,this.runner.setVelocity(u)}),p("Sensor",s,u=>{this.sensor=u,this.runner.setSensor(u)}),p("Range",o,u=>{this.range=u,this.runner.setRange(u)}),p("Halflife",l,u=>{this.halflife=u,this.runner.setHalflife(u)})]}static async from(e,t,i=5,n=200,r=10,s=2,o=.1){const l=window.devicePixelRatio||1;t.width=window.innerWidth*l,t.height=window.innerHeight*l,t.style.width=window.innerWidth+"px",t.style.height=window.innerHeight+"px";const d=await g.from(t,Math.round(e/1e3),i,n,r,s,o);return new x(d,t,e,i,n,r,s,o)}update(e){this.runner.render(e)}restart(){g.from(this.canvas,Math.max(Math.round(this.chasers/1e3),1),this.acceleration,this.velocity,this.sensor,this.range,this.halflife).then(e=>this.runner=e)}}const p=(c,e,t)=>{const i=document.createElement("div");i.setAttribute("style","display: flex");const n=document.createElement("p");n.setAttribute("style","flex-grow: 1; margin: 0"),n.innerText=c+":";const r=document.createElement("input");r.setAttribute("style","width: 30px; text-align: right;"),r.defaultValue=""+e;const s=()=>{const o=Number(r.value);isNaN(o)||t(o)};return r.onblur=s,r.onkeydown=o=>{o.code==="Enter"&&s()},i.append(n,r),i},I=document.getElementById("canvas");x.from(4e5,I).then(c=>{B(c),window.simulation=c}).catch(()=>{var e;const c=document.createElement("h4");c.innerText="This app does not work without Web GPU - try running Chrome Canary or Firefox Nightly, and enabling Web GPU",(e=I.parentElement)==null||e.appendChild(c)});
