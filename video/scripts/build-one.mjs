import { buildShot } from './build-lib.mjs';
const name = process.argv[2];
const dur = Number(process.argv[3] || 0) || undefined;
buildShot({ shot: name, out: `out/${name}.mp4`, duration: dur, captions: [] });
