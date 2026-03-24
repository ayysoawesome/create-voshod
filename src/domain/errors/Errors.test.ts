import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from './DomainError.js';
import { InfrastructureError } from './InfrastructureError.js';

test('DomainError has expected code', () => {
  const error = new DomainError('domain failure');
  assert.equal(error.code, 'DOMAIN_ERROR');
});

test('InfrastructureError has expected code', () => {
  const error = new InfrastructureError('infra failure');
  assert.equal(error.code, 'INFRASTRUCTURE_ERROR');
});
