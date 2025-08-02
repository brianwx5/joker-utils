import { withContext } from '../src/logger';
import { transports } from 'winston';
import { Writable } from 'stream';

test('logger adds context and redacts sensitive fields', async () => {
  const logs: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      logs.push(chunk.toString());
      callback();
    },
  });

  const transport = new transports.Stream({ stream });
  const child = withContext({ traceId: 't1', userId: 'u1', token: 'secret' });
  child.add(transport);
  child.info('hello');

  await new Promise((resolve) => setTimeout(resolve, 10));

  const output = logs.join('');
  expect(output).toContain('"traceId":"t1"');
  expect(output).not.toContain('secret');

  child.remove(transport);
});

