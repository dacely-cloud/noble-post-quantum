# @dacely/noble-post-quantum

Auditable & minimal JS implementation of post-quantum public-key cryptography.

- 🔒 Auditable
- 🔻 Tree-shakeable: unused code is excluded from your builds
- 🔍 Reliable: tests ensure correctness
- 🦾 ML-KEM & CRYSTALS-Kyber: lattice-based KEM from FIPS-203
- 🔋 ML-DSA & CRYSTALS-Dilithium: lattice-based signatures from FIPS-204
- 🐈 SLH-DSA & SPHINCS+: hash-based Winternitz signatures from FIPS-205
- 🦅 Falcon: lattice-based signatures from Falcon Round 3
- 🧊 Threshold ML-DSA: distributed key generation (DKG) & t-of-n threshold signing (Permafrost)
- 🍡 Hybrid algorithms, combining classic & post-quantum: Concrete, XWing, KitchenSink
- 🪶 16KB (gzipped) for everything, including bundled hashes & curves

> [!NOTE]
> This is a **fork of [paulmillr/noble-post-quantum](https://github.com/paulmillr/noble-post-quantum)**,
> maintained by [Dacely Cloud](https://github.com/dacely-cloud). It tracks the upstream
> official release (currently `0.6.1`, including its Mar/Apr-2026 self-audit) and adds a
> **Threshold ML-DSA** module (distributed key generation + threshold signing).
>
> The Threshold ML-DSA implementation ("Permafrost") was contributed by
> **[btc-vision](https://github.com/btc-vision)** — see the [contribution notice](#contributors--credits).

> [!IMPORTANT]
> NIST published [IR 8547](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf),
> prohibiting classical cryptography (RSA, DSA, ECDSA, ECDH) after 2035.
> Australian ASD does same thing [after 2030](https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/ism/cyber-security-guidelines/guidelines-cryptography).
> Take it into an account while designing a new cryptographic system.

### This library belongs to _noble_ cryptography

> **noble cryptography** — high-security, easily auditable set of contained cryptographic libraries and tools.

- Zero or minimal dependencies
- Highly readable TypeScript / JS code
- PGP-signed releases and transparent NPM builds
- All libraries:
  [ciphers](https://github.com/paulmillr/noble-ciphers),
  [curves](https://github.com/paulmillr/noble-curves),
  [hashes](https://github.com/paulmillr/noble-hashes),
  [post-quantum](https://github.com/paulmillr/noble-post-quantum),
  5kb [secp256k1](https://github.com/paulmillr/noble-secp256k1) /
  [ed25519](https://github.com/paulmillr/noble-ed25519)
- WASM version: [awasm-noble](https://github.com/paulmillr/awasm-noble)
- [Check out the homepage](https://paulmillr.com/noble/)
  for reading resources, documentation, and apps built with noble

## Usage

> `npm install @dacely/noble-post-quantum`

> `deno add jsr:@dacely/noble-post-quantum`

We support all major platforms and runtimes.
For React Native, you may need a
[polyfill for getRandomValues](https://github.com/LinusU/react-native-get-random-values).
A standalone file
[noble-post-quantum.js](https://github.com/paulmillr/noble-post-quantum/releases) is also available.

```js
// import * from '@dacely/noble-post-quantum'; // Error: use sub-imports instead
import { ml_kem512, ml_kem768, ml_kem1024 } from '@dacely/noble-post-quantum/ml-kem.js';
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@dacely/noble-post-quantum/ml-dsa.js';
import {
  slh_dsa_sha2_128f,
  slh_dsa_sha2_128s,
  slh_dsa_sha2_192f,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_256f,
  slh_dsa_sha2_256s,
  slh_dsa_shake_128f,
  slh_dsa_shake_128s,
  slh_dsa_shake_192f,
  slh_dsa_shake_192s,
  slh_dsa_shake_256f,
  slh_dsa_shake_256s,
} from '@dacely/noble-post-quantum/slh-dsa.js';
import {
  falcon512, falcon512padded, falcon1024, falcon1024padded,
} from '@dacely/noble-post-quantum/falcon.js';
import {
  ml_kem768_x25519, ml_kem768_p256, ml_kem1024_p384,
  KitchenSink_ml_kem768_x25519, XWing,
  QSF_ml_kem768_p256, QSF_ml_kem1024_p384,
} from '@dacely/noble-post-quantum/hybrid.js';
```

- [ML-KEM / Kyber](#ml-kem--kyber-shared-secrets)
- [ML-DSA / Dilithium](#ml-dsa--dilithium-signatures)
- [SLH-DSA / SPHINCS+](#slh-dsa--sphincs-signatures)
- [Falcon](#falcon-signatures)
- [Threshold ML-DSA (DKG & threshold signing)](#threshold-ml-dsa-dkg--threshold-signing)
- [hybrid: XWing, KitchenSink and others](#hybrid-xwing-kitchensink-and-others)
- [What should I use?](#what-should-i-use)
- [Security](#security)
- [Speed](#speed)
- [Contributing & testing](#contributing--testing)
- [Contributors & credits](#contributors--credits)
- [License](#license)

### ML-KEM / Kyber shared secrets

```ts
import { ml_kem512, ml_kem768, ml_kem1024 } from '@dacely/noble-post-quantum/ml-kem.js';
import { randomBytes } from '@dacely/noble-post-quantum/utils.js';
import { notDeepStrictEqual } from 'node:assert';
const seed = randomBytes(64); // seed is optional
const aliceKeys = ml_kem768.keygen(seed);
const { cipherText, sharedSecret: bobShared } = ml_kem768.encapsulate(aliceKeys.publicKey);
const aliceShared = ml_kem768.decapsulate(cipherText, aliceKeys.secretKey);

// Warning: Can be MITM-ed
const malloryKeys = ml_kem768.keygen();
const malloryShared = ml_kem768.decapsulate(cipherText, malloryKeys.secretKey); // No error!
notDeepStrictEqual(aliceShared, malloryShared); // Different key!
```

Lattice-based key encapsulation mechanism, defined in [FIPS-203](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf) ([website](https://www.pq-crystals.org/kyber/resources.shtml), [repo](https://github.com/pq-crystals/kyber)).
Can be used as follows:

1. *Alice* generates secret & public keys, then sends publicKey to *Bob*
2. *Bob* generates shared secret for Alice publicKey.
  bobShared never leaves *Bob* system and is unknown to other parties
3. *Alice* gets and decrypts cipherText from Bob
  Now, both Alice and Bob have same sharedSecret key
  without exchanging in plainText: aliceShared == bobShared.

There are some concerns with regards to security: see
[djb blog](https://blog.cr.yp.to/20231003-countcorrectly.html) and
[mailing list](https://groups.google.com/a/list.nist.gov/g/pqc-forum/c/W2VOzy0wz_E).
Old, incompatible version (Kyber) is not provided. Open an issue if you need it.

> [!WARNING]
> Unlike ECDH, KEM doesn't verify whether it was "Bob" who've sent the ciphertext.
> Instead of throwing an error when the ciphertext is encrypted by a different pubkey,
> `decapsulate` will simply return a different shared secret.
> ML-KEM is also probabilistic and relies on quality of CSPRNG.

### ML-DSA / Dilithium signatures

```ts
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@dacely/noble-post-quantum/ml-dsa.js';
import { randomBytes } from '@dacely/noble-post-quantum/utils.js';
const seed = randomBytes(32); // seed is optional
const keys = ml_dsa65.keygen(seed);
const msg = new TextEncoder().encode('hello noble');
const sig = ml_dsa65.sign(msg, keys.secretKey);
const isValid = ml_dsa65.verify(sig, msg, keys.publicKey);
```

Lattice-based digital signature algorithm, defined in [FIPS-204](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf) ([website](https://www.pq-crystals.org/dilithium/index.shtml),
[repo](https://github.com/pq-crystals/dilithium)).
The internals are similar to ML-KEM, but keys and params are different.

### SLH-DSA / SPHINCS+ signatures

```ts
import {
  slh_dsa_sha2_128f as sph,
  slh_dsa_sha2_128s,
  slh_dsa_sha2_192f,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_256f,
  slh_dsa_sha2_256s,
  slh_dsa_shake_128f,
  slh_dsa_shake_128s,
  slh_dsa_shake_192f,
  slh_dsa_shake_192s,
  slh_dsa_shake_256f,
  slh_dsa_shake_256s,
} from '@dacely/noble-post-quantum/slh-dsa.js';

const keys2 = sph.keygen();
const msg2 = new TextEncoder().encode('hello noble');
const sig2 = sph.sign(msg2, keys2.secretKey);
const isValid2 = sph.verify(sig2, msg2, keys2.publicKey);
```

Hash-based digital signature algorithm, defined in [FIPS-205](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf) ([website](https://sphincs.org), [repo](https://github.com/sphincs/sphincsplus)). We implement spec v3.1 with FIPS adjustments.

- sha2 vs shake (sha3): indicates internal hash function used
- 128 / 192 / 256: indicates security level in bits
- s / f: indicates small vs fast trade-off

SLH-DSA is slow: see [benchmarks](#speed) for key size & speed.

### Falcon signatures

```ts
import { falcon512, falcon1024 } from '@dacely/noble-post-quantum/falcon.js';
import { randomBytes } from '@dacely/noble-post-quantum/utils.js';
const seed3 = randomBytes(48); // seed is optional
const keys3 = falcon512.keygen(seed3);
const msg3 = new TextEncoder().encode('hello noble');
const sig3 = falcon512.sign(msg3, keys3.secretKey);
const isValid3 = falcon512.verify(sig3, msg3, keys3.publicKey);
```

Lattice-based digital signature algorithm, submitted to NIST PQC Round 3 ([website](https://falcon-sign.info/), [Round 3 submissions](https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization/round-3-submissions)).

> [!WARNING]
> This is Falcon Round 3, not FN-DSA. FN-DSA is not final yet.
> FN-DSA (FIPS-206) would most likely be backwards-incompatible with Falcon.
> The implementation passes the published Round 3 KATs.

- `falcon512`, `falcon1024`: variable-length detached signatures
- `falcon512padded`, `falcon1024padded`: fixed-length detached signatures
- `attached.seal(...)` / `attached.open(...)`: attached-signature API for Round 3 vectors and interop

### Threshold ML-DSA (DKG & threshold signing)

```ts
import { ml_dsa44 } from '@dacely/noble-post-quantum/ml-dsa.js';
import { ThresholdMLDSA } from '@dacely/noble-post-quantum/threshold-ml-dsa.js';

// 2-of-3 threshold at ML-DSA-44 (also supports 65, 87)
const th = ThresholdMLDSA.create(44, 2, 3);

// Trusted-dealer key generation (see examples/ for full distributed DKG)
const { publicKey, shares } = th.keygen();

// Any T of N parties can sign together
const msg = new TextEncoder().encode('hello threshold');
const sig = th.sign(msg, publicKey, [shares[0], shares[2]]);

// The result is a STANDARD FIPS-204 signature — verifiers don't need to
// know it was threshold-produced.
const isValid = ml_dsa44.verify(sig, msg, publicKey); // true
```

`threshold-ml-dsa.js` implements **t-of-n threshold ML-DSA** ("Permafrost"): either a
trusted-dealer `keygen()` or a fully **distributed key generation (DKG)** protocol
(`Round1State` / `Round2State` and the multi-phase DKG API), followed by a round-based
threshold signing protocol. Output signatures are byte-compatible standard FIPS-204
ML-DSA signatures, so verification uses the ordinary `ml_dsa44/65/87.verify()`.

The threshold scheme is built on `ml-dsa-primitives.js` — an RFC-faithful, reusable
extraction of the FIPS-204 polynomial primitives. (The standard one-shot `ml-dsa.js`
keeps upstream's optimized internals, which are sound for the standard signing flow but
not intended for general primitive reuse; the threshold layer therefore relies on the
dedicated primitives module.)

See [`docs/threshold-ml-dsa-whitepaper.md`](docs/threshold-ml-dsa-whitepaper.md),
[`docs/distributed-dkg-plan.md`](docs/distributed-dkg-plan.md), the
[Permafrost whitepaper (PDF)](https://github.com/btc-vision/noble-post-quantum/blob/main/docs/permafrost-whitepaper.pdf)
and the runnable [`examples/`](examples/) for the full protocol.

> [!WARNING]
> Threshold ML-DSA / Permafrost is **not** part of FIPS-204 and has **not** been
> independently audited. Applicable findings from the threshold ML-DSA reference audit
> were applied, but the port itself is unaudited — do not use for production custody
> without formal review.

### hybrid: XWing, KitchenSink and others

```js
import {
  ml_kem768_x25519, ml_kem768_p256, ml_kem1024_p384,
  KitchenSink_ml_kem768_x25519, XWing,
  QSF_ml_kem768_p256, QSF_ml_kem1024_p384,
} from '@dacely/noble-post-quantum/hybrid.js';
```

Hybrid submodule combine post-quantum algorithms with elliptic curve cryptography:

- `ml_kem768_x25519`: ML-KEM-768 + X25519 (CG Framework, same as XWing)
- `ml_kem768_p256`: ML-KEM-768 + P-256 (CG Framework)
- `ml_kem1024_p384`: ML-KEM-1024 + P-384 (CG Framework)
- `KitchenSink_ml_kem768_x25519`: ML-KEM-768 + X25519 with HKDF-SHA256 combiner
- `QSF_ml_kem768_p256`: ML-KEM-768 + P-256 (QSF construction)
- `QSF_ml_kem1024_p384`: ML-KEM-1024 + P-384 (QSF construction)

The following spec drafts are matched:

- [irtf-cfrg-hybrid-kems-07](https://datatracker.ietf.org/doc/draft-irtf-cfrg-hybrid-kems/)
- [irtf-cfrg-concrete-hybrid-kems-02](https://datatracker.ietf.org/doc/draft-irtf-cfrg-concrete-hybrid-kems/)
- [connolly-cfrg-xwing-kem-09](https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/)
- [tls-westerbaan-xyber768d00-03](https://datatracker.ietf.org/doc/draft-tls-westerbaan-xyber768d00/)

### What should I use?

|         | Speed  | Key size    | Sig size    | Created in | Popularized in | Post-quantum? |
| ------- | ------ | ----------- | ----------- | ---------- | -------------- | ------------- |
| RSA     | Normal | 256B - 2KB  | 256B - 2KB  | 1970s      | 1990s          | No            |
| ECC     | Normal | 32 - 256B   | 48 - 128B   | 1980s      | 2010s          | No            |
| ML-KEM  | Fast   | 1.6 - 31KB  | 1KB         | 1990s      | 2020s          | Yes           |
| ML-DSA  | Normal | 1.3 - 2.5KB | 2.5 - 4.5KB | 1990s      | 2020s          | Yes           |
| SLH-DSA | Slow   | 32 - 128B   | 17 - 50KB   | 1970s      | 2020s          | Yes           |
| FN-DSA  | Slow   | 0.9 - 1.8KB | 0.6 - 1.2KB | 1990s      | 2020s          | Yes           |

We suggest to use ECC + ML-KEM for key agreement, ECC + SLH-DSA for signatures.

ML-KEM and ML-DSA are lattice-based. SLH-DSA is hash-based, which means it is built on top of older, more conservative primitives. NIST guidance for security levels:

- Category 3 (~AES-192): ML-KEM-768, ML-DSA-65, SLH-DSA-192
- Category 5 (~AES-256): ML-KEM-1024, ML-DSA-87, SLH-DSA-256

NIST recommends to use cat-3+, while australian [ASD only allows cat-5 after 2030](https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/ism/cyber-security-guidelines/guidelines-cryptography).

It's also useful to check out [NIST SP 800-131Ar3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar3.ipd.pdf)
for "Transitioning the Use of Cryptographic Algorithms and Key Lengths".

For [hashes](https://github.com/paulmillr/noble-hashes), use SHA512 or SHA3-512 (not SHA256); and for [ciphers](https://github.com/paulmillr/noble-ciphers) ensure AES-256 or ChaCha.

## Security

The library has not been independently audited yet.

- The **upstream** `noble-post-quantum` core (ML-KEM, ML-DSA, SLH-DSA, Falcon, hybrid) was
  self-audited by its author at version `0.6.1` (Apr 2026, scope: everything). This fork
  tracks that audited core unchanged — see
  [upstream changes since audit](https://github.com/paulmillr/noble-post-quantum/compare/0.6.1..main).
- The **Threshold ML-DSA** addition in this fork is **not** covered by that audit and is not
  part of FIPS-204. Applicable findings from the threshold ML-DSA reference audit were applied
  in `threshold-ml-dsa.ts`, but the port itself is unaudited.

If you see anything unusual: investigate and report.

### Constant-timeness

There is no protection against side-channel attacks.
We actively research how to provide this property for post-quantum algorithms in JS.
Keep in mind that even hardware versions ML-KEM [are vulnerable](https://eprint.iacr.org/2023/1084).

### Supply chain security

- **Releases** are published through GitHub CI with npm Trusted Publishing / provenance. Be sure to verify the [provenance logs](https://docs.npmjs.com/generating-provenance-statements) for authenticity.
- **Rare releasing** is practiced to minimize the need for re-audits by end-users.
- **Dependencies** are minimized and strictly pinned to reduce supply-chain risk.
  - We use as few dependencies as possible.
  - Version ranges are locked, and changes are checked with npm-diff.
- **Dev dependencies** are excluded from end-user installs; they're only used for development and build steps.

For this package, there are 3 dependencies; and a few dev dependencies:

- [noble-hashes](https://github.com/paulmillr/noble-hashes) provides cryptographic hashing functionality, used internally in every algorithm
- [noble-curves](https://github.com/paulmillr/noble-curves) provides elliptic curve cryptography for hybrid algorithms
- [noble-ciphers](https://github.com/paulmillr/noble-ciphers) provides authenticated encryption used by hybrid combiners
- jsbt is used for benchmarking / testing / build tooling
- prettier, fast-check and typescript are used for code quality / test generation / ts compilation

### Randomness

We rely on the built-in
[`crypto.getRandomValues`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues),
which is considered a cryptographically secure PRNG.

Browsers have had weaknesses in the past - and could again - but implementing a userspace CSPRNG is even worse, as there’s no reliable userspace source of high-quality entropy.

## Contributing & testing

- `npm install && npm run build && npm test` will build the code and run tests.
- `npm run format` will fix formatting issues.
- `npm run bench` will run benchmarks
- `npm run build:release` will build single file

Check out [github.com/paulmillr/guidelines](https://github.com/paulmillr/guidelines)
for general coding practices and rules.

See [paulmillr.com/noble](https://paulmillr.com/noble/)
for useful resources, articles, documentation and demos
related to the upstream library.

## Speed

> `npm run bench`

Noble is the fastest JS implementation of post-quantum algorithms.

There is experimental [awasm git branch](https://github.com/paulmillr/noble-post-quantum/tree/awasm),
which uses WASM-based [awasm-noble](https://github.com/paulmillr/awasm-noble) for hashing.
It has 80% faster ML-KEM, 30% faster ML-DSA, 2.3x faster SLH-DSA-SHA256, 15x faster SLH-DSA-SHAKE.
The SHAKE-s version is much more usable in WASM variant. Try it out!

Benchmarks on Apple M4 (operations/sec, **higher is better**):

| Primitive         | Keygen | Signing | Verification | Shared secret |
| ----------------- | ------ | ------- | ------------ | ------------- |
| ML-KEM-768        | 4661   |         |              | 4089          |
| ML-DSA65          | 669    | 271     | 565          |               |
| Falcon512         | 14     | 749     | 2160         |               |
| SLH-DSA-SHA2-192f | 235    | 8       | 159          |               |
| Pre-quantum x/ed25519     | 12648  | 6157    | 1255         | 1981          |

SLH-DSA (s has 2x shorter signatures; SHAKE is very slow):

|            | keygen | sign   | verify |
| ---------- | ------ | ------ | ------ |
| sha2_128f  | 2ms    | 65ms   | 4ms    |
| shake_128f | 10ms   | 248ms  | 15ms   |
| sha2_192f  | 4ms    | 117ms  | 6ms    |
| shake_192f | 15ms   | 407ms  | 22ms   |
| sha2_256f  | 11ms   | 250ms  | 6ms    |
| shake_256f | 42ms   | 840ms  | 22ms   |
| sha2_128s  | 190ms  | 1350ms | 1ms    |
| shake_128s | 700ms  | 5264ms | 5ms    |
| sha2_192s  | 272ms  | 2900ms | 2ms    |
| shake_192s | 1000ms | 9100ms | 7ms    |
| sha2_256s  | 190ms  | 2600ms | 3ms    |
| shake_256s | 672ms  | 8070ms | 3ms    |

Key and signature sizes:

| Variant | Public key | Secret key | Signature / Ciphertext |
|---|---:|---:|---:|
| ML-KEM-512 | 800 | 1632 | 768 |
| ML-KEM-768 | 1184 | 2400 | 1088 |
| ML-KEM-1024 | 1568 | 3168 | 1568 |
| ML-DSA-44 | 1312 | 2560 | 2420 |
| ML-DSA-65 | 1952 | 4032 | 3309 |
| ML-DSA-87 | 2592 | 4896 | 4627 |
| Falcon512 | 897 | 1281 | 666 |
| Falcon1024 | 1793 | 2305 | 1280 |
| SLH-DSA-128f | 32 | 64 | 17088 |
| SLH-DSA-128s | 32 | 64 | 7856 |
| SLH-DSA-192f | 48 | 96 | 35664 |
| SLH-DSA-192s | 48 | 96 | 16224 |
| SLH-DSA-256f | 64 | 128 | 49856 |
| SLH-DSA-256s | 64 | 128 | 29792 |


## Contributors & credits

This package builds on the work of several upstream projects and contributors:

- **[paulmillr/noble-post-quantum](https://github.com/paulmillr/noble-post-quantum)** by
  [Paul Miller](https://paulmillr.com) — the audited ML-KEM / ML-DSA / SLH-DSA / Falcon /
  hybrid core. This fork tracks it directly and keeps it unchanged.
- **[btc-vision](https://github.com/btc-vision)** — original authors of the **Threshold
  ML-DSA ("Permafrost")** implementation: the distributed key generation (DKG) protocol,
  the threshold signing rounds, the RFC-faithful `ml-dsa-primitives` extraction, the test
  suite, and the accompanying whitepapers under [`docs/`](docs/). The Threshold ML-DSA
  module in this repository is derived from their contribution.
- **[Dacely Cloud](https://github.com/dacely-cloud)** — maintains this fork: rebases the
  threshold work onto the upstream official release and publishes `@dacely/noble-post-quantum`.

> The threshold primitives are a fork-time snapshot of upstream's polynomial math. If upstream
> ships a behavioral fix to its primitives, `ml-dsa-primitives.ts` must be manually re-synced.

## License

The MIT License (MIT)

Copyright (c) 2024 Paul Miller [(https://paulmillr.com)](https://paulmillr.com) (upstream noble-post-quantum)
Copyright (c) 2026 btc-vision (Threshold ML-DSA / Permafrost contribution)
Copyright (c) 2026 Dacely Cloud (fork maintenance)

See LICENSE file.
