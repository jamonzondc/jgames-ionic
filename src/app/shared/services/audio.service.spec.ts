import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

/**
 * Leaving the page must take the soundtrack with it: on a phone the page
 * keeps living in the background and the music would play on over whatever
 * app the player moved to.
 */
describe('AudioService page visibility', () => {
  let service: AudioService;
  let play: jest.SpyInstance;
  let pause: jest.SpyInstance;

  const setHidden = (hidden: boolean): void => {
    Object.defineProperty(document, 'hidden', {
      value: hidden,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: hidden ? 'hidden' : 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  beforeEach(() => {
    localStorage.clear();
    play = jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    pause = jest
      .spyOn(window.HTMLMediaElement.prototype, 'pause')
      .mockImplementation((): void => undefined);
    // jsdom reports every media element as paused, so playback has to be
    // faked for the service's own "already playing" check.
    Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
      value: true,
      configurable: true,
    });

    TestBed.configureTestingModule({ providers: [AudioService] });
    service = TestBed.inject(AudioService);
    service.setGameRunning(true);
    service.unlock();
  });

  afterEach(() => {
    setHidden(false);
    // Destroys the injector, which unhooks the service's page listeners: they
    // live on document and window and would otherwise pile up across tests.
    TestBed.resetTestingModule();
    jest.restoreAllMocks();
  });

  it('starts the music once the player has touched something', () => {
    expect(play).toHaveBeenCalled();
  });

  it('pauses the music when the page is hidden', () => {
    pause.mockClear();

    setHidden(true);

    expect(pause).toHaveBeenCalled();
  });

  it('resumes the music when the page comes back', () => {
    setHidden(true);
    play.mockClear();

    setHidden(false);

    expect(play).toHaveBeenCalled();
  });

  it('pauses on the window events Safari sends instead', () => {
    pause.mockClear();

    window.dispatchEvent(new Event('pagehide'));

    expect(pause).toHaveBeenCalled();
  });

  it('stays silent on return when the player muted the game', () => {
    service.toggleMute();
    expect(service.isMuted()).toBe(true);
    setHidden(true);
    play.mockClear();

    setHidden(false);

    expect(play).not.toHaveBeenCalled();
  });

  it('stays silent on return when the game is not running', () => {
    service.setGameRunning(false);
    setHidden(true);
    play.mockClear();

    setHidden(false);

    expect(play).not.toHaveBeenCalled();
  });
});
