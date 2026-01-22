/**
 * Voice Notification Utility
 * Provides audio feedback using Web Speech Synthesis API
 */

/**
 * Speaks a success message with a technological synthetic voice
 * Uses Web Speech API to say "Registro exitoso" in Spanish
 */
export const speakSuccess = (): void => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
        console.warn('Speech Synthesis API not supported in this browser');
        return;
    }

    try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance('Registro exitoso');

        // Configure voice parameters for technological sound
        utterance.lang = 'es-ES'; // Spanish
        utterance.pitch = 1.2; // Slightly higher pitch for technological feel
        utterance.rate = 1.1; // Slightly faster rate
        utterance.volume = 0.8; // Not too loud

        // Try to select a Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(
            (voice) =>
                voice.lang.startsWith('es') ||
                voice.lang.startsWith('ES') ||
                voice.name.toLowerCase().includes('spanish')
        );

        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        // Speak the message
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Error speaking success message:', error);
    }
};

/**
 * Initialize voices (some browsers need this)
 * Call this on app initialization to ensure voices are loaded
 */
export const initVoices = (): void => {
    if ('speechSynthesis' in window) {
        // Load voices
        window.speechSynthesis.getVoices();

        // Some browsers need this event listener
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
};
