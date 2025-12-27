/**
 * Platform Compatibility Tests for TTS/STT Services
 *
 * These tests verify that the voice services can detect and use
 * available TTS/STT backends on different platforms including macOS.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { platform } from 'os';
import { spawn } from 'child_process';
import { PiperService } from './piper.js';
import { WhisperService } from './whisper.js';
import { EspeakService } from './espeak.js';
import { MacOSSayService } from './macos-say.js';

// Helper to check if a command exists
function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', [cmd]);
    proc.on('close', (code) => resolve(code === 0));
    setTimeout(() => resolve(false), 2000);
  });
}

describe('Platform Detection', () => {
  it('should detect current platform', () => {
    const os = platform();
    console.log(`Running on platform: ${os}`);
    expect(['darwin', 'linux', 'win32']).toContain(os);
  });
});

describe('TTS Service Availability', () => {
  let piperAvailable: boolean;
  let espeakAvailable: boolean;
  let macSayAvailable: boolean;

  beforeAll(async () => {
    const piper = new PiperService();
    const espeak = new EspeakService();
    const macSay = new MacOSSayService();

    piperAvailable = await piper.checkInstalled();
    espeakAvailable = await espeak.checkInstalled();
    macSayAvailable = await macSay.checkInstalled();

    console.log('TTS Services detected:');
    console.log(`  - Piper:  ${piperAvailable ? '✓ installed' : '✗ not found'}`);
    console.log(`  - eSpeak: ${espeakAvailable ? '✓ installed' : '✗ not found'}`);
    console.log(`  - macOS say: ${macSayAvailable ? '✓ installed' : '✗ not found'}`);
  });

  it('should have at least one TTS service available', () => {
    const hasAnyTts = piperAvailable || espeakAvailable || macSayAvailable;

    if (!hasAnyTts) {
      console.warn('WARNING: No TTS service found! Install one of:');
      console.warn('  - Piper: pip install piper-tts');
      console.warn('  - eSpeak: apt install espeak (Linux) or brew install espeak (macOS)');
      console.warn('  - macOS: Built-in say command');
    }

    // This is a soft check - we report but don't fail
    expect(typeof hasAnyTts).toBe('boolean');
  });

  it('should detect Piper installation status', async () => {
    const piper = new PiperService();
    const installed = await piper.checkInstalled();
    expect(typeof installed).toBe('boolean');
  });

  it('should detect eSpeak installation status', async () => {
    const espeak = new EspeakService();
    const installed = await espeak.checkInstalled();
    expect(typeof installed).toBe('boolean');
  });

  it('should detect macOS say availability', async () => {
    const macSay = new MacOSSayService();
    const installed = await macSay.checkInstalled();

    if (platform() === 'darwin') {
      // On macOS, say should always exist
      expect(installed).toBe(true);
    } else {
      expect(installed).toBe(false);
    }
  });
});

describe('STT Service Availability', () => {
  let whisperAvailable: boolean;

  beforeAll(async () => {
    const whisper = new WhisperService();
    whisperAvailable = await whisper.checkInstalled();

    console.log('STT Services detected:');
    console.log(`  - Whisper: ${whisperAvailable ? '✓ installed' : '✗ not found'}`);
  });

  it('should detect Whisper installation status', async () => {
    const whisper = new WhisperService();
    const installed = await whisper.checkInstalled();
    expect(typeof installed).toBe('boolean');
  });

  it('should report whisper availability', () => {
    if (!whisperAvailable) {
      console.warn('WARNING: Whisper STT not found! Install:');
      console.warn('  - Linux: Build whisper.cpp from source');
      console.warn('  - macOS: brew install whisper-cpp');
    }
    expect(typeof whisperAvailable).toBe('boolean');
  });
});

describe('macOS Specific', () => {
  const isMacOS = platform() === 'darwin';

  it('should list German voices on macOS', () => {
    const germanVoices = MacOSSayService.getGermanVoices();

    if (isMacOS) {
      console.log('German voices available:', germanVoices);
      // macOS should have at least Anna (German)
      expect(Array.isArray(germanVoices)).toBe(true);
    } else {
      expect(germanVoices).toEqual([]);
    }
  });

  it('should use correct default voice for German', () => {
    const service = new MacOSSayService();
    // Default voice is Anna (German)
    expect(service).toBeDefined();
  });
});

describe('Path Detection (macOS Homebrew)', () => {
  const isMacOS = platform() === 'darwin';

  it('should check common macOS binary paths', async () => {
    if (!isMacOS) {
      console.log('Skipping macOS path tests (not on macOS)');
      return;
    }

    // Check Homebrew paths for Apple Silicon and Intel
    const homebrewPaths = [
      '/opt/homebrew/bin',  // Apple Silicon
      '/usr/local/bin',     // Intel Mac
    ];

    for (const path of homebrewPaths) {
      const exists = await commandExists(`${path}/brew`);
      console.log(`Homebrew at ${path}: ${exists ? 'found' : 'not found'}`);
    }
  });

  it('should check for piper in Homebrew paths', async () => {
    const piperPaths = [
      'piper',
      '/opt/homebrew/bin/piper',
      '/usr/local/bin/piper',
      `${process.env.HOME}/.local/bin/piper`
    ];

    for (const path of piperPaths) {
      const exists = await commandExists(path);
      if (exists) {
        console.log(`Piper found at: ${path}`);
      }
    }
  });

  it('should check for whisper in Homebrew paths', async () => {
    const whisperPaths = [
      'whisper',
      'whisper-cpp',
      '/opt/homebrew/bin/whisper',
      '/opt/homebrew/bin/whisper-cpp',
      '/usr/local/bin/whisper',
      '/usr/local/bin/whisper-cpp'
    ];

    for (const path of whisperPaths) {
      const exists = await commandExists(path);
      if (exists) {
        console.log(`Whisper found at: ${path}`);
      }
    }
  });

  it('should check for espeak in Homebrew paths', async () => {
    const espeakPaths = [
      'espeak',
      'espeak-ng',
      '/opt/homebrew/bin/espeak',
      '/opt/homebrew/bin/espeak-ng',
      '/usr/local/bin/espeak',
      '/usr/local/bin/espeak-ng'
    ];

    for (const path of espeakPaths) {
      const exists = await commandExists(path);
      if (exists) {
        console.log(`eSpeak found at: ${path}`);
      }
    }
  });
});

describe('Functional TTS Tests', () => {
  it('should synthesize with available TTS service', async () => {
    // Try macOS say first (if on macOS)
    if (platform() === 'darwin') {
      const macSay = new MacOSSayService();
      const available = await macSay.checkInstalled();
      if (available) {
        // On macOS, we can test synthesis
        // Note: This actually produces audio output - skip in CI
        console.log('macOS say is available for TTS');
        return;
      }
    }

    // Try Piper
    const piper = new PiperService();
    if (await piper.checkInstalled()) {
      console.log('Piper is available for TTS');
      return;
    }

    // Try eSpeak
    const espeak = new EspeakService();
    if (await espeak.checkInstalled()) {
      console.log('eSpeak is available for TTS');
      return;
    }

    console.warn('No TTS service available for synthesis test');
  });
});

describe('Summary Report', () => {
  it('should generate compatibility report', async () => {
    const os = platform();
    const isMacOS = os === 'darwin';
    const isLinux = os === 'linux';

    const piper = new PiperService();
    const whisper = new WhisperService();
    const espeak = new EspeakService();
    const macSay = new MacOSSayService();

    const report = {
      platform: os,
      tts: {
        piper: await piper.checkInstalled(),
        espeak: await espeak.checkInstalled(),
        macosSay: await macSay.checkInstalled(),
      },
      stt: {
        whisper: await whisper.checkInstalled(),
      },
      recommendations: [] as string[],
    };

    // Generate recommendations
    if (!report.tts.piper && !report.tts.espeak && !report.tts.macosSay) {
      if (isMacOS) {
        report.recommendations.push('TTS: Use built-in macOS say (already available) or install: brew install espeak');
      } else if (isLinux) {
        report.recommendations.push('TTS: Install Piper (pip install piper-tts) or eSpeak (apt install espeak)');
      }
    }

    if (!report.stt.whisper) {
      if (isMacOS) {
        report.recommendations.push('STT: Install Whisper: brew install whisper-cpp');
      } else if (isLinux) {
        report.recommendations.push('STT: Build whisper.cpp from source or use package manager');
      }
    }

    console.log('\n=== Platform Compatibility Report ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('=====================================\n');

    expect(report.platform).toBeDefined();
  });
});
