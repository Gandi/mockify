#!/usr/bin/env node

/**
 * This file is the procKr cli.
 *
 * Usage examples:
 * $ procKr start
 * $ procKr add-target 4000 http://jsonplaceholder.typicode.com jsonplaceholder
 * $ procKr list-targets
 * $ procKr enable-target jsonplaceholder
 * $ procKr mock-target jsonplaceholder
 *
 * See README.md for more informations.
 */

'use strict';

var program   = require('commander');

var //fs        = require('fs'),
    program      = require('commander'),
    procKr       = require('../procKr'),
    alertHdlr    = require('./handler/alert')(),
    targetHdlr   = require('./handler/target')(),
    log          = function () { console.log.apply(this, arguments); },
    exit         = function () { process.exit(1); },
    logExit      = function () { log.apply(this, arguments); exit(); };

// @FIxME
// program.version(JSON.parse(fs.readFileSync('package.json')).version);
program.version('0.0.1');

program
  .command('start')
  .description('Start the daemon.')
  .action(procKr.start);

program
  .command('stop')
  .description('Stop procKr daemon.')
  .action(procKr.stop);

program
  .command('status')
  .description('Check procKr status.')
  .action(procKr.status);

program
  .command('hello')
  .description('Say hello to procKr to test websocket connexion.')
  .action(procKr.hello);

program
  .command('start-http')
  .description('Start the procKr http server.')
  .action(function () {
    procKr.startHttp().then(logExit, alertHdlr.error);
  });

program
  .command('stop-http')
  .description('Stop the procKr http server.')
  .action(function () {
    procKr.stopHttp().then(logExit, alertHdlr.error);
  });

program
  .command('list-targets')
  .description('List the targets.')
  .action(function () {
    procKr.listTargets().then(targetHdlr.list, alertHdlr.error);
  });

program.parse(process.argv);

if (!program.args.length) {
  log(program.helpInformation());
  process.exit();
}
