import path from 'node:path';
import fs from 'node:fs';
import esbuild from 'esbuild';
import type { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { mtime: number; code: string }>();

/**
 * On-the-fly TypeScript transpiler middleware for browser requests
 * Serves .ts files in public directory as modern ES Modules with Content-Type: application/javascript
 */
export const tsTranspiler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path.endsWith('.ts')) {
    const filePath = path.join(process.cwd(), 'public', req.path);

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const cached = cache.get(filePath);

        if (cached && cached.mtime === stats.mtimeMs) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.send(cached.code);
          return;
        }

        const source = fs.readFileSync(filePath, 'utf-8');
        const result = esbuild.transformSync(source, {
          loader: 'ts',
          format: 'esm',
          target: 'esnext',
          sourcemap: 'inline',
        });

        cache.set(filePath, { mtime: stats.mtimeMs, code: result.code });

        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.send(result.code);
        return;
      } catch (err) {
        console.error('[TS Transpile Error]:', err);
        next(err);
        return;
      }
    }
  }

  next();
};

