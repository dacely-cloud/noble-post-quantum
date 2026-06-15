// Resync guard for src/ml-dsa-primitives.ts.
//
// ml-dsa-primitives.ts is a fork-time extraction of upstream's FIPS-204 ring primitives,
// shared by the Threshold ML-DSA layer. It is kept deliberately separate from the
// audited one-shot ml-dsa.ts (whose optimized internals are not meant for general reuse).
// This test pins the parameter-dependent primitives to an INDEPENDENT, from-spec FIPS-204
// reference (Algorithms 35/36/37/38/40) across the coefficient domain, so any drift from
// the standard is caught immediately. MakeHint's optimized predicate is validated
// end-to-end by threshold.test.ts / acvp.test.ts instead (it is intentionally not a
// drop-in for Algorithm 39 on arbitrary inputs).
import { describe, should } from '@paulmillr/jsbt/test.js';
import { deepStrictEqual as eql } from 'node:assert';
import { XOF128, XOF256 } from '../src/_crystals.ts';
import { createMLDSAPrimitives, Q, D, GAMMA2_1, GAMMA2_2 } from '../src/ml-dsa-primitives.ts';

// --- Independent FIPS-204 reference (Algorithms 35, 36, 37, 38, 40) ---
function smodRef(a: number, m: number): number {
    let r = ((a % m) + m) % m;
    if (r > m >> 1) r -= m;
    return r;
}
function power2RoundRef(r: number): { r1: number; r0: number } {
    const rp = ((r % Q) + Q) % Q;
    const r0 = smodRef(rp, 1 << D);
    return { r1: (rp - r0) / (1 << D), r0 };
}
function decomposeRef(r: number, gamma2: number): { r1: number; r0: number } {
    const rp = ((r % Q) + Q) % Q;
    let r0 = smodRef(rp, 2 * gamma2);
    if (rp - r0 === Q - 1) return { r1: 0, r0: r0 - 1 };
    return { r1: (rp - r0) / (2 * gamma2), r0 };
}
function useHintRef(h: number, r: number, gamma2: number): number {
    const m = (Q - 1) / (2 * gamma2);
    const { r1, r0 } = decomposeRef(r, gamma2);
    if (h === 1) return r0 > 0 ? (((r1 + 1) % m) + m) % m : (((r1 - 1) % m) + m) % m;
    return r1;
}

function mkPrim(gamma2: number, level: 44 | 65) {
    const base = { XOF128, XOF256, CRH_BYTES: 64, TR_BYTES: 64 };
    if (level === 44)
        return createMLDSAPrimitives({
            ...base,
            K: 4,
            L: 4,
            GAMMA1: 2 ** 17,
            GAMMA2: gamma2,
            TAU: 39,
            ETA: 2,
            OMEGA: 80,
            C_TILDE_BYTES: 32,
        });
    return createMLDSAPrimitives({
        ...base,
        K: 6,
        L: 5,
        GAMMA1: 2 ** 19,
        GAMMA2: gamma2,
        TAU: 49,
        ETA: 4,
        OMEGA: 55,
        C_TILDE_BYTES: 48,
    });
}

// Dense sampling (stride relatively prime to the lattice structure) + explicit boundaries.
// Full-domain exhaustive (~16.7M points) passes too; this stride keeps the suite fast.
const STRIDE = 4099;

describe('ml-dsa-primitives resync (FIPS-204)', () => {
    for (const [gamma2, level] of [
        [GAMMA2_1, 44],
        [GAMMA2_2, 65],
    ] as const) {
        const p = mkPrim(gamma2, level);
        const edges = [0, 1, 2, gamma2, 2 * gamma2, Q - 1, Q - 2, Q - 2 * gamma2, (Q - 1) / 2];

        should(`decompose / HighBits / LowBits match reference (level ${level})`, () => {
            for (let r = 0; r < Q; r += STRIDE) {
                const ref = decomposeRef(r, gamma2);
                eql(p.decompose(r), ref);
                eql(p.HighBits(r), ref.r1);
                eql(p.LowBits(r), ref.r0);
            }
            for (const r of edges) eql(p.decompose(r), decomposeRef(r, gamma2));
        });

        should(`UseHint matches reference for h in {0,1} (level ${level})`, () => {
            for (let r = 0; r < Q; r += STRIDE) {
                eql(p.UseHint(0, r), useHintRef(0, r, gamma2));
                eql(p.UseHint(1, r), useHintRef(1, r, gamma2));
            }
            for (const r of edges) {
                eql(p.UseHint(0, r), useHintRef(0, r, gamma2));
                eql(p.UseHint(1, r), useHintRef(1, r, gamma2));
            }
        });

        should(`Power2Round matches reference (level ${level})`, () => {
            for (let r = 0; r < Q; r += STRIDE) eql(p.Power2Round(r), power2RoundRef(r));
            for (const r of edges) eql(p.Power2Round(r), power2RoundRef(r));
        });
    }
});

should.runWhen(import.meta.url);
