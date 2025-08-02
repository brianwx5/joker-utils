import { logger, withContext } from './logger';

export class Hello {
  public sayHello(): string {
    logger.info('sayHello called');
    return 'hello, world!';
  }
}

export { logger, withContext };
