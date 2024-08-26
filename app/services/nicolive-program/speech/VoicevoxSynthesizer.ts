import { Speech } from '../nicolive-comment-synthesizer';
import { ISpeechSynthesizer } from './ISpeechSynthesizer';

export const VoicevoxURL = `http://localhost:50021`;

export class VoicevoxSynthesizer implements ISpeechSynthesizer {
  get available(): boolean {
    return true;
  }

  private speakingPromise: Promise<void> | null = null;
  private speakingResolve: () => void | null = null;
  private speakingCounter: number = 0;

  async output(speech: Speech) {
    try {
      const id = speech.voicevox?.id ?? '1';
      // POSTなのに・・
      const r1 = await fetch(
        `${VoicevoxURL}/audio_query?speaker=${id}&text=${encodeURIComponent(speech.text)}`,
        { method: 'POST' },
      );

      const r2 = await r1.text();

      const r3 = await fetch(`${VoicevoxURL}/synthesis?speaker=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
        body: r2,
      });

      const r4 = await r3.blob();
      const url = URL.createObjectURL(r4);

      const audio = new Audio(url);
      await audio.play();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.log(e);
    }
  }

  speakText(speech: Speech, onstart: () => void, onend: () => void) {
    return async () => async () => {
      if (!speech || speech.text === '' || !this.available) {
        return null;
      }
      if (!this.speakingPromise) {
        this.speakingPromise = new Promise(resolve => {
          this.speakingResolve = resolve;
        });
      }

      onstart();
      this.output(speech).then(() => {
        if (--this.speakingCounter === 0) {
          this.speakingResolve();
          this.speakingPromise = null;
          this.speakingResolve = null;
        }
        onend();
      });

      this.speakingCounter++;
      return {
        cancel: async () => {
          speechSynthesis.cancel();
        },
        running: this.speakingPromise,
      };
    };
  }
}
