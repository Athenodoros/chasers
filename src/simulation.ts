import { Vector2 } from "./maths";
import { Chaser } from "./types";

const CHASER_COUNT = 2000;
const CHASER_SPEED = 4;
const TURN_SPEED = 20;

export class ChaserSimulation {
    public list: Chaser[];
    public bounds: Vector2;

    constructor(bounds: Vector2) {
        this.list = [...Array(CHASER_COUNT)].map(() => {
            const position = Vector2.random(Math.sqrt(Math.random()) * Math.min(bounds.x, bounds.y) * 0.4).plus(
                new Vector2(bounds.x / 2, bounds.y / 2)
            );
            return {
                position,
                previous: position,
                heading: Math.random() * 2 * Math.PI,
            };
        });
        this.bounds = bounds;
    }

    update(dt: number, data: ImageData, dpr: number) {
        this.list.forEach((chaser) => {
            const { position, heading } = chaser;
            chaser.previous = position;

            const center = sampleDataAtLocation(position.plus(Vector2.radial(heading, 20)), data, dpr);
            const left = sampleDataAtLocation(position.plus(Vector2.radial(heading + Math.PI / 3, 20)), data, dpr);
            const right = sampleDataAtLocation(position.plus(Vector2.radial(heading - Math.PI / 3, 20)), data, dpr);

            if (center >= left && center >= right) {
            } else if (left >= center && left >= right) chaser.heading += Math.random() * TURN_SPEED * dt;
            else if (right >= center && right >= left) chaser.heading -= Math.random() * TURN_SPEED * dt;

            chaser.position = chaser.position
                .plus(Vector2.radial(chaser.heading, CHASER_SPEED))
                .clamped(1, this.bounds.x - 2, this.bounds.y - 2, 1);
        });
    }
}

const sampleDataAtLocation = (position: Vector2, data: ImageData, dpr: number) => {
    return (
        [-2, -1, 0, 1, 2]
            .flatMap((dx) =>
                [-2, -1, 0, 1, 2].map((dy) => {
                    const x = Math.round(position.x) + dx;
                    const y = Math.round(position.y) + dy;
                    if (x <= 0 || x >= data.width / dpr - 1 || y <= 0 || y >= data.height / dpr - 1) return -100;
                    return data.data[(y * data.width + x) * 4 * dpr];
                })
            )
            .reduce((acc, val) => acc + val, 0) *
        (Math.random() / 10 + 0.95)
    );
};
