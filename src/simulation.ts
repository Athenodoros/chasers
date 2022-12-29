import { add, dot, getRandomVector2, norm, scale, unit, Vector2, zero } from "./maths";
import { Chaser } from "./types";

const CHASER_COUNT = 100;
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
            const position = add(getRandomVector2(Math.sqrt(Math.random()) * Math.min(bounds.x, bounds.y) * 0.4), {
                x: bounds.x / 2,
                y: bounds.y / 2,
            });
            return {
                position,
                previous: position,
                velocity: getRandomVector2(CHASER_INITIAL_SPEED),
            };
        });
        this.bounds = bounds;
    }

    update(dt: number, data: ImageData, dpr: number) {
        this.list.forEach((chaser) => {
            chaser.previous = chaser.position;

            /**
             * Clamp to boundaries
             */
            if (chaser.position.x <= 1) {
                chaser.position.x = 1;
                chaser.velocity.x = Math.abs(chaser.velocity.x);
            }
            if (chaser.position.y <= 1) {
                chaser.position.y = 1;
                chaser.velocity.y = Math.abs(chaser.velocity.y);
            }
            if (chaser.position.x >= this.bounds.x - 1) {
                chaser.position.x = this.bounds.x - 1;
                chaser.velocity.x = -Math.abs(chaser.velocity.x);
            }
            if (chaser.position.y >= this.bounds.y - 1) {
                chaser.position.y = this.bounds.y - 1;
                chaser.velocity.y = -Math.abs(chaser.velocity.y);
            }

            /**
             * Calculate Forces
             */
            let force = zero();

            // Boundaries
            if (chaser.position.x < BOUNDARY_WIDTH) force.x += BOUNDARY_FORCE / chaser.position.x;
            if (this.bounds.x - chaser.position.x < BOUNDARY_WIDTH)
                force.x -= BOUNDARY_FORCE / (this.bounds.x - chaser.position.x);
            if (chaser.position.y < BOUNDARY_WIDTH) force.y += BOUNDARY_FORCE / chaser.position.y;
            if (this.bounds.y - chaser.position.y < BOUNDARY_WIDTH)
                force.y -= BOUNDARY_FORCE / (this.bounds.y - chaser.position.y);

            // Drag
            const deviation = add(chaser.velocity, scale(unit(chaser.velocity), -CHASER_DEFAULT_SPEED));
            force = add(force, scale(unit(deviation), -DRAG_CONSTANT * Math.pow(norm(deviation), 2)));

            // Chasing
            force = add(force, getChasingForce(chaser, data, dpr));

            /**
             * Apply physics and randomness
             */
            chaser.velocity = add(chaser.velocity, scale(force, dt), getRandomVector2(RANDOM_VELOCITY_SIZE));
            chaser.position = add(chaser.position, scale(chaser.velocity, dt));
        });
    }
}

const CHASING_FORCE_RADIUS = 20;
const CHASING_FORCE_MAGNITUDE = 10;

const range = (a: number, b: number) => [...Array(b - a)].map((_, i) => a + i);
const pointsInRadius = range(-CHASING_FORCE_RADIUS, CHASING_FORCE_RADIUS)
    .flatMap((y) =>
        range(-CHASING_FORCE_RADIUS, CHASING_FORCE_RADIUS).map((x) => ({
            x,
            y,
            direction: unit({ x, y }),
            distance: norm({ x, y }),
        }))
    )
    .filter(({ x, y }) => x * x + y * y <= CHASING_FORCE_RADIUS * CHASING_FORCE_RADIUS && x * x + y * y >= 4);

const BACKGROUND_R_CUTOFF = 100;

const getChasingForce = (chaser: Chaser, data: ImageData, dpr: number) => {
    let force = zero();

    const position = { x: Math.round(chaser.position.x), y: Math.round(chaser.position.y) };
    const direction = unit(chaser.velocity);

    pointsInRadius.forEach((point) => {
        if (dot(direction, point.direction) < Math.cos(Math.PI / 3)) return;

        const pixel = add(position, point);
        if (pixel.x < 0 || pixel.x >= data.width || pixel.y < 0 || pixel.y >= data.height) return;
        let value = data.data[(pixel.y * data.width + pixel.x) * 4 * dpr] ?? 0;
        value = Math.max(value, BACKGROUND_R_CUTOFF) - BACKGROUND_R_CUTOFF;

        force = add(force, scale(direction, (value * CHASING_FORCE_MAGNITUDE) / point.distance));
    });

    return force;
};
