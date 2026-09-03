/**
 * Action Tailor - Root Entry Point
 * Re-exports the shared Express.js backend for backward compatibility and serverless deployments
 */
import app, { server } from './backend/index.ts';

export { app, server };
export default app;
