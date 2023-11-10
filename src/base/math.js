// export const math = (function() {
//   return {
//     rand_range: function(a, b) {
//       return Math.random() * (b - a) + a;
//     },

//     rand_normalish: function() {
//       const r = Math.random() + Math.random() + Math.random() + Math.random();
//       return (r / 4.0) * 2.0 - 1;
//     },

//     rand_int: function(a, b) {
//       return Math.round(Math.random() * (b - a) + a);
//     },

//     lerp: function(x, a, b) {
//       return x * (b - a) + a;
//     },

//     smoothstep: function(x, a, b) {
//       x = x * x * (3.0 - 2.0 * x);
//       return x * (b - a) + a;
//     },

//     smootherstep: function(x, a, b) {
//       x = x * x * x * (x * (x * 6 - 15) + 10);
//       return x * (b - a) + a;
//     },

//     clamp: function(x, a, b) {
//       return Math.min(Math.max(x, a), b);
//     },

//     sat: function(x) {
//       return Math.min(Math.max(x, 0.0), 1.0);
//     },

//     in_range: (x, a, b) => {
//       return x >= a && x <= b;
//     },
//   };
// })();


import MersenneTwister from 'mersenne-twister';


let RNG_ = new MersenneTwister();

export function set_seed(seed) {
  RNG_ = new MersenneTwister(seed);
}

export function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

export function sat(x) {
  return Math.min(Math.max(x, 0.0), 1.0);
}

export function in_range(x, a, b) {
  return x >= a && x <= b;
}

export function easeOut(x, t) {
  return 1.0 - Math.pow(1.0 - x, t);
}

export function easeIn(x, t) {
  return Math.pow(x, t);
}

export function rand_range(a, b) {
  return RNG_.random() * (b - a) + a;
}

export function rand_normalish() {
  const r = RNG_.random() + RNG_.random() + RNG_.random() + RNG_.random();
  return (r / 4.0) * 2.0 - 1;
}

export function rand_int(a, b) {
  return Math.round(RNG_.random() * (b - a) + a);
}

export function lerp(x, a, b) {
  return x * (b - a) + a;
}

export function smoothstep(edge0, edge1, x) {
  const t = sat((x - edge0) / (edge1 - edge0));
  return t * t * (3.0 - 2.0 * t);
}

export function smootherstep(edge0, edge1, x) {
  const t = sat((x - edge0) / (edge1 - edge0));
  return (t * t * t * (t * (t * 6 - 15) + 10));
}
