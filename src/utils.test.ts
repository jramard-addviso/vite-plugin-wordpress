import { phpConfigTemplate } from './utils.js'
import { test, expect } from 'vitest'

test('phpConfigTemplate', () => {
  expect(
    phpConfigTemplate({
      rootDir: '',
      outDir: 'dist',
      assetsDir: 'assets',
      manifest: undefined,
    }),
  ).toBe(`<?php
// This is an auto-generated file. Please avoid making changes here.
// Configure your settings in the "vite.config.js" file instead.
return [
  'rootDir' => '',
  'outDir' => 'dist',
  'assetsDir' => 'assets'
];`)
})
