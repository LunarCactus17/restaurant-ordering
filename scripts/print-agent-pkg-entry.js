process.env.DATABASE_URL ??= `file:${require('node:path').join(process.cwd(), 'prisma', 'dev.db')}`;

require('tsx/cjs');
require('./print-agent-daemon.ts');
