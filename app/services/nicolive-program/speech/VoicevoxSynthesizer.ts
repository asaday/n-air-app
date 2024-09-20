import { Speech } from '../nicolive-comment-synthesizer';
import { ISpeechSynthesizer } from './ISpeechSynthesizer';

export const VoicevoxURL = `http://localhost:50080`;

export class VoicevoxSynthesizer implements ISpeechSynthesizer {
  private speakingPromise: Promise<void> | null = null;
  private speakingResolve: () => void | null = null;
  private speakingCounter: number = 0;

  async output(speech: Speech) {
    try {
      console.log('vox 1');
      const id = speech.voicevox?.id ?? '1';
      const r1 = await fetch(
        `${VoicevoxURL}/Talk?voice=${id}&text=${encodeURIComponent(speech.text)}`,
      );
      console.log('vox 4');
    } catch (e) {
      console.log(e);
    }
  }

  speakText(speech: Speech, onstart: () => void, onend: () => void) {
    return async () => async () => {
      if (!speech || speech.text === '') {
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
