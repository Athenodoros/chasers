import { Vector2 } from "../utils/maths";
import { Chaser } from "../utils/types";

const CHASER_SPEED = 5;
const TURN_SPEED = 10;

export class Simulation {
    public list: Chaser[];
    public bounds: Vector2;

    constructor(count: number, bounds: Vector2) {
        this.list = [...Array(count)].map(() => {
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

            const center = sampleDataAtLocation(position.plus(Vector2.radial(heading, 50)), data, dpr);
            const left = sampleDataAtLocation(position.plus(Vector2.radial(heading + Math.PI / 3, 50)), data, dpr);
            const right = sampleDataAtLocation(position.plus(Vector2.radial(heading - Math.PI / 3, 50)), data, dpr);

            if (center > left && center > right) {
            } else if (left >= center && left >= right) chaser.heading += (Math.random() + 0.5) * TURN_SPEED * dt;
            else if (right >= center && right >= left) chaser.heading -= (Math.random() + 0.5) * TURN_SPEED * dt;

            chaser.position = chaser.position
                .plus(Vector2.radial(chaser.heading, CHASER_SPEED))
                .clamped(1, this.bounds.x - 2, this.bounds.y - 2, 1);
        });
    }
}

const positions = [-2, -1, 0, 1, 2].flatMap((dx) => [-2, -1, 0, 1, 2].map((dy) => [dx, dy] as [number, number]));

const sampleDataAtLocation = (position: Vector2, data: ImageData, dpr: number) => {
    const px = Math.round(position.x);
    const py = Math.round(position.y);

    return (
        positions
            .map(([dx, dy]) => {
                const x = dx + px;
                const y = dy + py;
                if (x <= 2 || x >= data.width / dpr - 3 || y <= 2 || y >= data.height / dpr - 3) return -100;
                return data.data[(y * data.width + x) * 4 * dpr];
            })
            .reduce((acc, val) => acc + val, 0) *
        (Math.random() / 10 + 0.95)
    );
};
