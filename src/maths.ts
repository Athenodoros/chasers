export interface Vector2 {
    x: number;
    y: number;
}

export function getRandomVector2(magnitude: number): Vector2;
export function getRandomVector2(bounds: Vector2): Vector2;
export function getRandomVector2(boundsOrMagnitude: Vector2 | number): Vector2 {
    if (typeof boundsOrMagnitude === "number") {
        const orientation = Math.random() * Math.PI * 2;
        return {
            y: boundsOrMagnitude * Math.cos(orientation),
            x: boundsOrMagnitude * Math.sin(orientation),
        };
    }

    return { x: Math.random() * boundsOrMagnitude.x, y: Math.random() * boundsOrMagnitude.y };
}

export const zero = () => ({ x: 0, y: 0 });

export const scale = ({ x, y }: Vector2, r: number) => ({ x: x * r, y: y * r });
export const add = (...vectors: Vector2[]) => ({
    x: vectors.reduce((acc, { x }) => acc + x, 0),
    y: vectors.reduce((acc, { y }) => acc + y, 0),
});
export const subtract = (a: Vector2, b: Vector2) => ({ x: a.x - b.x, y: a.y - b.y });
export const norm = ({ x, y }: Vector2) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
export const unit = ({ x, y }: Vector2) => {
    const length = norm({ x, y });
    return length ? { x: x / length, y: y / length } : zero();
};
export const distance = (a: Vector2, b: Vector2) => norm(subtract(a, b));
export const dot = (a: Vector2, b: Vector2) => a.x * b.x + a.y * b.y;
