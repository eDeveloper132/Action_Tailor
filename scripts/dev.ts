import { spawn, type ChildProcess } from 'node:child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n======================================================'));
console.log(chalk.bold.cyan('    Action Tailor - Multi-Project Ecosystem Runner    '));
console.log(chalk.bold.cyan('======================================================\n'));

console.log(chalk.blue.bold('  [BACKEND]  ') + chalk.underline('http://localhost:5000') + chalk.gray(' (Express.js + MongoDB + Socket.IO)'));
console.log(chalk.magenta.bold('  [ADMIN]    ') + chalk.underline('http://localhost:3001') + chalk.gray(' (Master Tailor Desk & Staff)'));
console.log(chalk.green.bold('  [CUSTOMER] ') + chalk.underline('http://localhost:3002') + chalk.gray(' (Customer Portal & Suit Tracker)'));
console.log(chalk.gray('\nPress Ctrl+C to terminate all services.\n'));

const processes: { name: string; proc: ChildProcess; color: (s: string) => string }[] = [];

function spawnService(name: string, command: string, args: string[], cwd: string, color: (s: string) => string) {
  const isWindows = process.platform === 'win32';
  const proc = spawn(isWindows ? `${command}.cmd` : command, args, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  proc.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(color(`[${name}] `) + line);
      }
    }
  });

  proc.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(color(`[${name}] `) + chalk.red(line));
      }
    }
  });

  proc.on('close', (code) => {
    console.log(color(`[${name}] `) + chalk.gray(`process exited with code ${code}`));
  });

  processes.push({ name, proc, color });
}

// 1. Spawn Backend API (Port 5000)
spawnService('BACKEND', 'npx', ['tsx', 'watch', 'index.ts'], 'backend', chalk.bold.blue);

// 2. Spawn Admin Frontend (Port 3001)
spawnService('ADMIN', 'npx', ['vite', '--port', '3001'], 'frontend-admin', chalk.bold.magenta);

// 3. Spawn Customer Frontend (Port 3002)
spawnService('CUSTOMER', 'npx', ['vite', '--port', '3002'], 'frontend-customer', chalk.bold.green);

// Handle graceful shutdown of all spawned processes
const shutdown = () => {
  console.log(chalk.yellow('\nShutting down all Action Tailor services...'));
  for (const { proc, name } of processes) {
    try {
      if (process.platform === 'win32' && proc.pid) {
        spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F']);
      } else {
        proc.kill('SIGTERM');
      }
    } catch (_e) {
      // Process already terminated
    }
  }
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

