import { Vector2 } from "./maths";

export interface Chaser {
    position: Vector2;
    previous: Vector2;
    heading: number;
}
