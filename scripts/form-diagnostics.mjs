#!/usr/bin/env node
import { runDiagnostics } from './hooks-diagnostics.mjs';

await runDiagnostics({ formOnly: true });
