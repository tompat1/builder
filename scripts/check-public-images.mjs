import path from 'node:path';
import { auditPublicImages } from './lib/public-images.mjs';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const errors = auditPublicImages(root);
if (errors.length === 0) process.exit(0);
console.error(errors.join('\n'));
process.exit(1);
