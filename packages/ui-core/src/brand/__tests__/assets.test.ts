/**
 * Brand asset SVG integrity tests
 *
 * Verifies each SVG file exists and satisfies brand requirements:
 * - BR-17: icon uses round linecap/linejoin
 * - BR-19: icon-light references Agile Teal #00C2CB
 * - Primary color #003B73 present in icon
 * - Wordmark contains "Relay" text (in <title> for accessibility)
 * - Logo includes both icon path data and wordmark text
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '../../brand/assets');

function readAsset(name: string): string {
  return readFileSync(join(ASSETS, name), 'utf-8');
}

describe('Brand SVG assets', () => {
  describe('icon.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('icon.svg');
      expect(svg).toContain('<svg');
    });

    it('BR-17: contains stroke-linecap="round"', () => {
      const svg = readAsset('icon.svg');
      expect(svg).toContain('stroke-linecap="round"');
    });

    it('BR-17: contains stroke-linejoin="round"', () => {
      const svg = readAsset('icon.svg');
      expect(svg).toContain('stroke-linejoin="round"');
    });

    it('references primary Deep Tech Blue #003B73', () => {
      const svg = readAsset('icon.svg');
      expect(svg).toContain('#003B73');
    });

    it('has accessible title "Relay"', () => {
      const svg = readAsset('icon.svg');
      expect(svg).toContain('<title>Relay</title>');
    });
  });

  describe('icon-light.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('icon-light.svg');
      expect(svg).toContain('<svg');
    });

    it('BR-19: references Agile Teal #00C2CB accent', () => {
      const svg = readAsset('icon-light.svg');
      expect(svg).toContain('#00C2CB');
    });

    it('BR-21: references white #FFFFFF for main stroke', () => {
      const svg = readAsset('icon-light.svg');
      expect(svg).toContain('#FFFFFF');
    });
  });

  describe('wordmark.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('wordmark.svg');
      expect(svg).toContain('<svg');
    });

    it('contains word "Relay" in <title> element for accessibility', () => {
      const svg = readAsset('wordmark.svg');
      expect(svg).toContain('<title>Relay</title>');
    });

    it('contains "Relay" text content', () => {
      const svg = readAsset('wordmark.svg');
      expect(svg).toContain('Relay');
    });

    it('references Ink Black #1A1A1A fill', () => {
      const svg = readAsset('wordmark.svg');
      expect(svg).toContain('#1A1A1A');
    });
  });

  describe('wordmark-light.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('wordmark-light.svg');
      expect(svg).toContain('<svg');
    });

    it('contains "Relay" in <title>', () => {
      const svg = readAsset('wordmark-light.svg');
      expect(svg).toContain('<title>Relay</title>');
    });

    it('uses white fill #FFFFFF', () => {
      const svg = readAsset('wordmark-light.svg');
      expect(svg).toContain('#FFFFFF');
    });
  });

  describe('logo.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('logo.svg');
      expect(svg).toContain('<svg');
    });

    it('includes icon path data (the R stem path)', () => {
      const svg = readAsset('logo.svg');
      // The continuous R path uses M10 40 as the start point
      expect(svg).toContain('M10 40');
    });

    it('includes wordmark text element', () => {
      const svg = readAsset('logo.svg');
      expect(svg).toContain('Relay');
    });

    it('includes the BR-11 bridge line between wordmark and icon', () => {
      const svg = readAsset('logo.svg');
      // Bridge line is marked by x1="118" in the SVG source
      expect(svg).toContain('x1="118"');
    });

    it('references Deep Tech Blue #003B73 for icon', () => {
      const svg = readAsset('logo.svg');
      expect(svg).toContain('#003B73');
    });

    it('references Ink Black #1A1A1A for wordmark', () => {
      const svg = readAsset('logo.svg');
      expect(svg).toContain('#1A1A1A');
    });
  });

  describe('logo-light.svg', () => {
    it('file exists and contains <svg', () => {
      const svg = readAsset('logo-light.svg');
      expect(svg).toContain('<svg');
    });

    it('references white #FFFFFF', () => {
      const svg = readAsset('logo-light.svg');
      expect(svg).toContain('#FFFFFF');
    });

    it('references Agile Teal #00C2CB for accents', () => {
      const svg = readAsset('logo-light.svg');
      expect(svg).toContain('#00C2CB');
    });
  });
});
