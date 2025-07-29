import { logger } from './logger';

export class Hello {
  public sayHello(): string {
    logger.info('sayHello called');
    return 'hello, world!';
  }
}

export { logger };
