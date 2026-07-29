#!/usr/bin/env node

import { createProgram } from './cli/program';

const program = createProgram();
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
