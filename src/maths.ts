export class Vector2 {
    static random(magnitude: number): Vector2;
    static random(bounds: Vector2): Vector2;
    static random(boundsOrMagnitude: Vector2 | number): Vector2 {
        if (typeof boundsOrMagnitude === "number") {
            const orientation = Math.random() * Math.PI * 2;
            return new Vector2(boundsOrMagnitude * Math.sin(orientation), boundsOrMagnitude * Math.cos(orientation));
        }

        return new Vector2(Math.random() * boundsOrMagnitude.x, Math.random() * boundsOrMagnitude.y);
    }

    static zero = () => new Vector2(0, 0);

    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    scaled = (scale: number) => new Vector2(this.x * scale, this.y * scale);
    plus(x: number, y: number): Vector2;
    plus(...others: Vector2[]): Vector2;
    plus(...others: Vector2[] | [number, number]) {
        if (typeof others[0] === "number") return new Vector2(this.x + others[0], this.y + (others[1] as number));

        return new Vector2(
            (others as Vector2[]).reduce((acc, val) => acc + val.x, this.x),
            (others as Vector2[]).reduce((acc, val) => acc + val.y, this.y)
        );
    }
    minus(x: number, y: number): Vector2;
    minus(other: Vector2): Vector2;
    minus(...others: [Vector2] | [number, number]) {
        if (typeof others[0] === "number") return new Vector2(this.x - others[0], this.y - (others[1] as number));

        return new Vector2(this.x - others[0].x, this.y - others[0].y);
    }
    norm = () => Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    unit = () => {
        const length = this.norm();
        return length ? new Vector2(this.x / length, this.y / length) : Vector2.zero();
    };
    distance = (target: Vector2) => this.minus(target).norm();
    dot = (other: Vector2) => this.x * other.x + this.y + other.y;
    clamped = (topleft: Vector2, bottomright: Vector2) =>
        new Vector2(
            Math.min(Math.max(this.x, topleft.x), bottomright.x),
            Math.min(Math.max(this.y, topleft.y), bottomright.y)
        );
}
