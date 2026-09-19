import { Injectable, OnDestroy } from '@angular/core';

interface ToneOptions {
  /** Starting pitch in Hz. */
  freq: number;
  /** Pitch to slide to over the tone's life, for sweeps. */
  to?: number;
  /** Seconds. */
  duration: number;
  type?: OscillatorType;
  /** Peak volume, 0 to 1. */
  gain?: number;
  /** Seconds to wait before this tone starts, for arpeggios. */
  delay?: number;
}

/**
 * Game audio: the looping soundtrack plus the arcade effects.
 *
 * The effects are synthesised with Web Audio rather than loaded as files, so
 * they weigh nothing, never arrive late, and all share one voice.
 *
 * Browsers refuse to start audio until the page has seen a real user gesture,
 * so nothing plays on load: the game calls `unlock()` from the first tap or
 * key press and the sound starts from there.
 */
@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {
  private static readonly MUTED_KEY: string = 'jgames.muted';
  private static readonly MUSIC_VOLUME: number = 0.28;
  /** Sideways moves repeat fast; without this they turn into a rattle. */
  private static readonly MOVE_THROTTLE_MS: number = 45;

  private readonly music: HTMLAudioElement = new Audio(
    'assets/audio/game-music.mp3'
  );
  private muted: boolean = this.readMuted();
  private unlocked: boolean = false;
  private gameRunning: boolean = false;
  private context: AudioContext | undefined;
  private lastMoveTime: number = 0;
  private readonly onHidden = (): void => this.onPageHidden();
  private readonly onVisible = (): void => this.onPageVisible();
  private readonly onVisibilityChange = (): void =>
    document.hidden ? this.onPageHidden() : this.onPageVisible();

  constructor() {
    this.music.loop = true;
    this.music.volume = AudioService.MUSIC_VOLUME;
    this.music.preload = 'auto';
    this.followPageVisibility();
  }

  /**
   * Switching to another app must take the soundtrack with it. On a phone the
   * page keeps living in the background, so without this the music plays on
   * over whatever the player moved to.
   */
  private followPageVisibility(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Safari does not always report a visibility change when the app is
    // swiped away, so the window's own events back it up.
    window.addEventListener('pagehide', this.onHidden);
    window.addEventListener('blur', this.onHidden);
    window.addEventListener('focus', this.onVisible);
  }

  public ngOnDestroy(): void {
    if (typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('pagehide', this.onHidden);
    window.removeEventListener('blur', this.onHidden);
    window.removeEventListener('focus', this.onVisible);
    this.music.pause();
  }

  private onPageHidden(): void {
    this.music.pause();
    // Effects run through Web Audio, which keeps its own clock.
    this.context?.suspend().catch((): void => undefined);
  }

  private onPageVisible(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.resume();
    this.context?.resume().catch((): void => undefined);
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Called from a real user gesture, which is what lets audio start at all. */
  public unlock(): void {
    this.unlocked = true;
    this.resume();
  }

  /** The soundtrack follows the game: it stops on pause and on game over. */
  public setGameRunning(running: boolean): void {
    this.gameRunning = running;
    if (running) this.resume();
    else this.music.pause();
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.writeMuted();

    if (this.muted) {
      this.music.pause();
    } else {
      // Tapping the button is itself the gesture that permits playback.
      this.unlocked = true;
      this.resume();
    }
    return this.muted;
  }

  // --- Effects -------------------------------------------------------------

  public move(): void {
    const now: number = Date.now();
    if (now - this.lastMoveTime < AudioService.MOVE_THROTTLE_MS) return;
    this.lastMoveTime = now;
    this.tone({ freq: 200, duration: 0.04, type: 'square', gain: 0.05 });
  }

  public rotate(): void {
    this.tone({
      freq: 440,
      to: 680,
      duration: 0.07,
      type: 'square',
      gain: 0.08,
    });
  }

  /** The whoosh of a piece slammed down. */
  public hardDrop(): void {
    this.tone({
      freq: 620,
      to: 130,
      duration: 0.15,
      type: 'sawtooth',
      gain: 0.1,
    });
  }

  /** The thud of a piece settling into the stack. */
  public lock(): void {
    this.tone({
      freq: 130,
      to: 60,
      duration: 0.11,
      type: 'triangle',
      gain: 0.15,
    });
  }

  /** Rising arpeggio, longer and higher the more rows went at once. */
  public lineClear(rows: number = 1): void {
    const scale: number[] = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const notes: number[] = scale.slice(0, Math.min(2 + rows, scale.length));
    notes.forEach((freq: number, index: number): void => {
      this.tone({
        freq,
        duration: 0.13,
        type: 'square',
        gain: 0.11,
        delay: index * 0.055,
      });
    });
  }

  public levelUp(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach(
      (freq: number, index: number): void => {
        this.tone({
          freq,
          duration: 0.18,
          type: 'triangle',
          gain: 0.14,
          delay: index * 0.09,
        });
      }
    );
  }

  public gameOver(): void {
    [440, 349.23, 293.66, 220].forEach(
      (freq: number, index: number): void => {
        this.tone({
          freq,
          duration: 0.22,
          type: 'sawtooth',
          gain: 0.13,
          delay: index * 0.16,
        });
      }
    );
  }

  // --- Plumbing ------------------------------------------------------------

  private tone(options: ToneOptions): void {
    const context: AudioContext | undefined = this.getContext();
    if (!context) return;

    const start: number = context.currentTime + (options.delay ?? 0);
    const end: number = start + options.duration;
    const peak: number = options.gain ?? 0.1;

    const oscillator: OscillatorNode = context.createOscillator();
    oscillator.type = options.type ?? 'square';
    oscillator.frequency.setValueAtTime(options.freq, start);
    if (options.to) {
      oscillator.frequency.exponentialRampToValueAtTime(options.to, end);
    }

    // Ramps to a hair above zero, never to zero: exponential ramps cannot
    // reach it, and a hard stop would click.
    const amplifier: GainNode = context.createGain();
    amplifier.gain.setValueAtTime(0.0001, start);
    amplifier.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    amplifier.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(amplifier);
    amplifier.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }

  private getContext(): AudioContext | undefined {
    if (this.muted || !this.unlocked) return undefined;

    if (!this.context) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      // No Web Audio (old browser, or jsdom under test): the game is silent
      // but otherwise unaffected.
      if (!Ctor) return undefined;
      this.context = new Ctor();
    }

    // Safari suspends the context when the tab goes to the background.
    if (this.context.state === 'suspended') {
      this.context.resume().catch((): void => undefined);
    }
    return this.context;
  }

  private resume(): void {
    if (this.muted || !this.unlocked || !this.gameRunning) return;
    // Every gesture calls unlock(); only the first one has anything to start.
    if (!this.music.paused) return;
    const started: Promise<void> | undefined = this.music.play();
    // A soundtrack the browser declines to play is not worth an error.
    if (started) started.catch((): void => undefined);
  }

  private readMuted(): boolean {
    try {
      return localStorage.getItem(AudioService.MUTED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private writeMuted(): void {
    try {
      localStorage.setItem(AudioService.MUTED_KEY, String(this.muted));
    } catch {
      // Private browsing: the choice just will not survive a reload.
    }
  }
}
