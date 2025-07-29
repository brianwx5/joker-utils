import { configure, getLogger } from 'log4js';

configure({
  appenders: {
    out: { type: 'console' },
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
  },
});

export const logger = getLogger();
