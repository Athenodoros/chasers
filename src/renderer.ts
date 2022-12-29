import { Vector2 } from "./maths";
import { Chaser } from "./types";

const BACKGROUND = "#0a091a";
const WHITE = "#e0e7ff";

export class Renderer {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public viewport: Vector2;
    public dpr: number;

    constructor() {
        // Set up canvas and draw context
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;

        this.viewport = { x: window.innerWidth, y: innerHeight };

        // Set up scaling
        this.dpr = window.devicePixelRatio || 1;
        this.updateCanvasSizes();
        this.clear();

        // Scaling on Window Resize
        window.onresize = () => this.resizeCanvas();
    }

    private updateCanvasSizes() {
        scaleCanvas(this.canvas, this.viewport, this.dpr);
        this.ctx.scale(this.dpr, this.dpr);
    }

    private resizeCanvas() {
        this.viewport.x = window.innerWidth;
        this.viewport.y = window.innerHeight;

        // Cache everything on temporary canvas
        const copyProjectileCanvas = getCanvasCopy(this.canvas, this.dpr);
        const copyNodeCanvas = getCanvasCopy(this.canvas, this.dpr);

        this.updateCanvasSizes();

        this.ctx.drawImage(copyProjectileCanvas, 0, 0);
        this.ctx.drawImage(copyNodeCanvas, 0, 0);
    }

    updateCanvasFrame(dt: number, chasers: Chaser[]) {
        const alpha = 1 - Math.pow(0.1, dt);

        // Fade background
        this.ctx.fillStyle = BACKGROUND;
        this.ctx.globalAlpha = alpha;
        this.ctx.rect(0, 0, this.viewport.x, this.viewport.y);
        this.ctx.fill();

        // Draw components
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = WHITE;
        this.ctx.strokeStyle = WHITE;

        this.ctx.lineWidth = 4;
        chasers.forEach(({ position, previous }) => {
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();

            this.ctx.beginPath();
            this.ctx.moveTo(previous.x, previous.y);
            this.ctx.lineTo(position.x, position.y);

            const gradient = this.ctx.createLinearGradient(previous.x, previous.y, position.x, position.y);
            gradient.addColorStop(1, WHITE);
            gradient.addColorStop(0, interpolateColours(WHITE, BACKGROUND, alpha));
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = gradient;

            this.ctx.stroke();
        });
    }

    clear() {
        this.ctx.fillStyle = BACKGROUND;
        this.ctx.globalAlpha = 1;
        this.ctx.rect(0, 0, this.viewport.x, this.viewport.y);
        this.ctx.fill();
    }

    getImageData() {
        return this.ctx.getImageData(0, 0, this.viewport.x * this.dpr, this.viewport.y * this.dpr);
    }
}

const scaleCanvas = (canvas: HTMLCanvasElement, viewport: Vector2, dpr: number) => {
    canvas.width = viewport.x * dpr;
    canvas.height = viewport.y * dpr;
    canvas.style.width = viewport.x + "px";
    canvas.style.height = viewport.y + "px";
};
const getCanvasCopy = (canvas: HTMLCanvasElement, dpr: number) => {
    const copy_canvas = document.createElement("canvas");
    const copy_ctx = copy_canvas.getContext("2d")!;
    copy_canvas.width = canvas.width;
    copy_canvas.height = canvas.height;
    copy_ctx.scale(1 / dpr, 1 / dpr);
    copy_ctx.drawImage(canvas, 0, 0);
    return copy_canvas;
};

const interpolateColours = (from: string, to: string, transparency: number) => {
    const [r1, g1, b1] = parseRGB(from);
    const [r2, g2, b2] = parseRGB(to);
    return (
        "#" +
        Math.round(r2 * transparency + r1 * (1 - transparency)).toString(16) +
        Math.round(g2 * transparency + g1 * (1 - transparency)).toString(16) +
        Math.round(b2 * transparency + b1 * (1 - transparency)).toString(16)
    );
};

const parseRGB = (colour: string) => {
    const [_, a, b, c, d, e, f] = colour;
    return [parseInt(a + b, 16), parseInt(c + d, 16), parseInt(e + f, 16)] as [number, number, number];
};
