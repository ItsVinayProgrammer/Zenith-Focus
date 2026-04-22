import { SOUND_OPTIONS, INITIAL_TIMER_SETTINGS } from '../constants';
import type { TimerSettings } from '../types';

const clampInteger = (value: unknown, fallback: number, min: number, max: number) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;

    const integerValue = Math.round(numericValue);
    if (integerValue < min || integerValue > max) return fallback;

    return integerValue;
};

export const validateSettings = (loadedSettings: Partial<TimerSettings>): TimerSettings => {
    // Combine loaded settings with defaults to create a full settings object
    const mergedSettings: TimerSettings = { ...INITIAL_TIMER_SETTINGS, ...loadedSettings };

    const validSoundUrls = new Set(SOUND_OPTIONS.map(s => s.url));
    let finalSoundUrl = mergedSettings.soundUrl;

    // Migration map for ALL old URLs (Google and Pixabay) to the new, more stable sources.
    const migrationMap: Record<string, string> = {
        // Google URLs -> New URLs
        'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg': SOUND_OPTIONS[0].url,
        'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg': SOUND_OPTIONS[1].url,
        'https://actions.google.com/sounds/v1/notifications/harp_notification.ogg': SOUND_OPTIONS[2].url,
        'https://actions.google.com/sounds/v1/impacts/sharp_metal_impact.ogg': SOUND_OPTIONS[3].url,
        'https://actions.google.com/sounds/v1/alarms/synth_alarm.ogg': SOUND_OPTIONS[4].url,
        // Pixabay URLs -> New URLs
        'https://cdn.pixabay.com/audio/2022/10/28/audio_167905586.mp3': SOUND_OPTIONS[0].url,
        'https://cdn.pixabay.com/audio/2022/03/15/audio_7dd395984c.mp3': SOUND_OPTIONS[1].url,
        'https://cdn.pixabay.com/audio/2022/03/24/audio_321b535230.mp3': SOUND_OPTIONS[2].url,
        'https://cdn.pixabay.com/audio/2022/03/22/audio_339c6e52c9.mp3': SOUND_OPTIONS[3].url,
        'https://cdn.pixabay.com/audio/2023/04/24/audio_9019b165b6.mp3': SOUND_OPTIONS[4].url,
    };

    if (typeof finalSoundUrl === 'string' && migrationMap[finalSoundUrl]) {
        finalSoundUrl = migrationMap[finalSoundUrl];
    }

    // Final validation: if the URL is still not in the current valid list, reset to default.
    if (typeof finalSoundUrl !== 'string' || !validSoundUrls.has(finalSoundUrl)) {
        finalSoundUrl = INITIAL_TIMER_SETTINGS.soundUrl;
    }

    const work = clampInteger(mergedSettings.work, INITIAL_TIMER_SETTINGS.work, 1, 180);
    const shortBreak = clampInteger(mergedSettings.shortBreak, INITIAL_TIMER_SETTINGS.shortBreak, 1, 60);
    const longBreak = clampInteger(mergedSettings.longBreak, INITIAL_TIMER_SETTINGS.longBreak, 1, 180);
    const pomodorosPerLongBreak = clampInteger(
        mergedSettings.pomodorosPerLongBreak,
        INITIAL_TIMER_SETTINGS.pomodorosPerLongBreak,
        1,
        12
    );
    
    // Return the fully validated and merged settings object.
    return {
        ...mergedSettings,
        work,
        shortBreak,
        longBreak,
        pomodorosPerLongBreak,
        soundUrl: finalSoundUrl,
    };
}