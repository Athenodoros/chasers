import { Vector2 } from "./maths";
import { Chaser } from "./types";

const CHASER_COUNT = 10;
const CHASER_DEFAULT_SPEED = 100;
const CHASER_INITIAL_SPEED = CHASER_DEFAULT_SPEED;
const BOUNDARY_FORCE = 10000;
const DRAG_CONSTANT = 0.01;
const RANDOM_VELOCITY_SIZE = 0;
const BOUNDARY_WIDTH = 50;

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
                velocity: Vector2.random(CHASER_INITIAL_SPEED),
            };
        });
        this.bounds = bounds;
    }

    update(dt: number, data: ImageData, dpr: number) {
        const clamps = [new Vector2(1, 1), new Vector2(this.bounds.x - 2, this.bounds.y - 2)] as const;

        this.list.forEach((chaser) => {
            chaser.previous = chaser.position;

            /**
             * Clamp to boundaries
             */
            if (chaser.position.x <= 1) {
                chaser.velocity = new Vector2(Math.abs(chaser.velocity.x), chaser.velocity.y);
            }
            if (chaser.position.y <= 1) {
                chaser.velocity = new Vector2(chaser.velocity.x, Math.abs(chaser.velocity.y));
            }
            if (chaser.position.x >= this.bounds.x - 1) {
                chaser.velocity = new Vector2(-Math.abs(chaser.velocity.x), chaser.velocity.y);
            }
            if (chaser.position.y >= this.bounds.y - 1) {
                chaser.velocity = new Vector2(chaser.velocity.x, -Math.abs(chaser.velocity.y));
            }
            chaser.position = chaser.position.clamped(...clamps);

            /**
             * Calculate Forces
             */
            let force = Vector2.zero();

            // Boundaries
            if (chaser.position.x < BOUNDARY_WIDTH) force = force.plus(BOUNDARY_FORCE / chaser.position.x, 0);
            if (this.bounds.x - chaser.position.x < BOUNDARY_WIDTH)
                force = force.minus(BOUNDARY_FORCE / (this.bounds.x - chaser.position.x), 0);
            if (chaser.position.y < BOUNDARY_WIDTH) force = force.plus(0, BOUNDARY_FORCE / chaser.position.y);
            if (this.bounds.y - chaser.position.y < BOUNDARY_WIDTH)
                force = force.minus(0, BOUNDARY_FORCE / (this.bounds.y - chaser.position.y));

            // Drag
            const deviation = chaser.velocity.plus(chaser.velocity.unit().scaled(-CHASER_DEFAULT_SPEED));
            force = force.plus(deviation.unit().scaled(-DRAG_CONSTANT * Math.pow(deviation.norm(), 2)));

            // Chasing
            force = force.plus(getChasingForce(chaser, data, dpr));

            /**
             * Apply physics and randomness
             */
            chaser.velocity = chaser.velocity.plus(force.scaled(dt), Vector2.random(RANDOM_VELOCITY_SIZE));
            chaser.position = chaser.position.plus(chaser.velocity.scaled(dt));
        });
    }
}

const CHASING_FORCE_RADIUS = 20;
const CHASING_FORCE_MAGNITUDE = 0;

const range = (a: number, b: number) => [...Array(b - a)].map((_, i) => a + i);
const pointsInRadius = range(-CHASING_FORCE_RADIUS, CHASING_FORCE_RADIUS)
    .flatMap((y) =>
        range(-CHASING_FORCE_RADIUS, CHASING_FORCE_RADIUS).map((x) => ({
            point: new Vector2(x, y),
            direction: new Vector2(x, y).unit(),
            distance: new Vector2(x, y).norm(),
        }))
    )
    .filter(
        ({ point: { x, y } }) => x * x + y * y <= CHASING_FORCE_RADIUS * CHASING_FORCE_RADIUS && x * x + y * y >= 4
    );

const BACKGROUND_R_CUTOFF = 100;

const getChasingForce = (chaser: Chaser, data: ImageData, dpr: number) => {
    let force = Vector2.zero();

    const position = new Vector2(Math.round(chaser.position.x), Math.round(chaser.position.y));
    const direction = chaser.velocity.unit();

    pointsInRadius.forEach((point) => {
        if (direction.dot(point.direction) < Math.cos(Math.PI / 3)) return;

        const pixel = position.plus(point.point);
        if (pixel.x < 0 || pixel.x >= data.width || pixel.y < 0 || pixel.y >= data.height) return;
        let value = data.data[(pixel.y * data.width + pixel.x) * 4 * dpr] ?? 0;
        value = Math.max(value, BACKGROUND_R_CUTOFF) - BACKGROUND_R_CUTOFF;

        force = force.plus(direction.scaled((value * CHASING_FORCE_MAGNITUDE) / point.distance));
    });

    return force;
};
