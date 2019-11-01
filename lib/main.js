import chalk from 'chalk';
import parseArgs from 'minimist';

const VERSION = 'Agoric 0.1.0';

const main = async (progname, rawArgs, { console, error }) => {
  const { _: args, ...opts } = parseArgs(rawArgs, {
    boolean: ['version', 'help'],
    stopEarly: true,
  });

  const usage = status => {
    if (status) {
      console.error(chalk.bold(`Type '${progname} --help' for more information.`));
      return status;
    }
    console.log(`\
Usage: ${progname} [command] [...args]

Manage the Agoric Javascript smart contract platform.

help    display this help and exit
`);
    return 0;
  };

  if (opts.version) {
    console.log(VERSION);
    return 0;
  }

  if (opts.help) {
    return usage(0);
  }

  const cmd = args[0];
  switch (cmd) {
    case undefined:
      error(`you must specify a COMMAND`);
      return usage(1);
    case 'help':
      return usage(0);
    default:
      error(`unrecognized COMMAND`, cmd);
      return usage(1);
  }
};

export default main;