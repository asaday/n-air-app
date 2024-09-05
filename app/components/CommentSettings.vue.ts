import { Inject } from 'services/core/injector';

import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';
import { NicoliveCommentSynthesizerService } from 'services/nicolive-program/nicolive-comment-synthesizer';
import {
  NicoliveProgramStateService,
  SynthesizerId,
  SynthesizerSelector,
  SynthesizerSelectors,
} from 'services/nicolive-program/state';
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import VueSlider from 'vue-slider-component';
import Multiselect from 'vue-multiselect';
import { HttpRelation } from 'services/nicolive-program/httpRelation';
import * as remote from '@electron/remote';
import { VoicevoxURL } from 'services/nicolive-program/speech/VoicevoxSynthesizer';

type MethodObject = {
  text: string;
  value: string;
};

type VoicevoxItem = {
  id: string;
  name: string;
  uuid?: string;
};

@Component({
  components: {
    Multiselect,
    VueSlider,
  },
})
export default class CommentSettings extends Vue {
  @Inject()
  private nicoliveCommentSynthesizerService: NicoliveCommentSynthesizerService;
  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;
  @Inject()
  private nicoliveProgramStateService: NicoliveProgramStateService;

  close() {
    this.$emit('close');
  }

  async testSpeechPlay(synthId: SynthesizerSelector, type?: string) {
    const service = this.nicoliveCommentSynthesizerService;
    if (synthId === 'ignore') return;
    service.startTestSpeech('これは読み上げ設定のテスト音声です', synthId, type);
  }

  mounted() {
    this.readVoicevoxList();
  }

  get enabled(): boolean {
    return this.nicoliveCommentSynthesizerService.enabled;
  }
  set enabled(e: boolean) {
    this.nicoliveCommentSynthesizerService.enabled = e;
  }

  get nameplateEnabled(): boolean {
    return this.nicoliveProgramStateService.state.nameplateEnabled;
  }
  set nameplateEnabled(e: boolean) {
    this.nicoliveProgramStateService.updateNameplateEnabled(e);
  }

  get rate(): number {
    return this.nicoliveCommentSynthesizerService.rate;
  }
  set rate(v: number) {
    this.nicoliveCommentSynthesizerService.rate = v;
  }
  get rateCandidates(): number[] {
    return [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2, 3, 4, 5, 6, 7,
      8, 9, 10,
    ];
  }
  get rateDefault(): number {
    return NicoliveCommentSynthesizerService.initialState.rate;
  }
  resetRate() {
    this.rate = this.rateDefault;
  }

  get volume(): number {
    return this.nicoliveCommentSynthesizerService.volume;
  }
  set volume(v: number) {
    this.nicoliveCommentSynthesizerService.volume = v;
  }
  get volumeCandidates(): number[] {
    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  }
  get volumeDefault(): number {
    return NicoliveCommentSynthesizerService.initialState.volume;
  }
  resetVolume() {
    this.volume = this.volumeDefault;
  }

  resetVoice() {
    this.resetRate();
    this.resetVolume();
  }

  get synthIds(): readonly SynthesizerSelector[] {
    return SynthesizerSelectors;
  }
  synthName(id: SynthesizerId): string {
    return this.$t(`settings.synthId.${id}`) as string;
  }
  get normal(): SynthesizerSelector {
    return this.nicoliveCommentSynthesizerService.normal;
  }
  set normal(s: SynthesizerSelector) {
    this.nicoliveCommentSynthesizerService.normal = s;
  }
  get normalDefault(): SynthesizerSelector {
    return NicoliveCommentSynthesizerService.initialState.selector.normal;
  }
  get operator(): SynthesizerSelector {
    return this.nicoliveCommentSynthesizerService.operator;
  }
  set operator(s: SynthesizerSelector) {
    this.nicoliveCommentSynthesizerService.operator = s;
  }
  get operatorDefault(): SynthesizerSelector {
    return NicoliveCommentSynthesizerService.initialState.selector.operator;
  }
  get system(): SynthesizerSelector {
    return this.nicoliveCommentSynthesizerService.system;
  }
  set system(s: SynthesizerSelector) {
    this.nicoliveCommentSynthesizerService.system = s;
  }
  get systemDefault(): SynthesizerSelector {
    return NicoliveCommentSynthesizerService.initialState.selector.system;
  }

  resetAssignment() {
    this.normal = this.normalDefault;
    this.operator = this.operatorDefault;
    this.system = this.systemDefault;
  }

  get showAnonymous() {
    return this.nicoliveCommentLocalFilterService.showAnonymous;
  }

  set showAnonymous(v: boolean) {
    this.nicoliveCommentLocalFilterService.showAnonymous = v;
  }

  //-----------------------------------------

  httpRelationMethods: MethodObject[] = [
    { value: '', text: '---' },
    { value: 'GET', text: 'GET' },
    { value: 'POST', text: 'POST' },
    { value: 'PUT', text: 'PUT' },
  ];

  get httpRelationMethod(): MethodObject {
    const value = this.nicoliveProgramStateService.state.httpRelation.method;
    const obj = this.httpRelationMethods.find(a => a.value === value);
    return obj ?? this.httpRelationMethods[0];
  }
  set httpRelationMethod(method: MethodObject) {
    this.nicoliveProgramStateService.updateHttpRelation({ method: method.value });
  }
  get httpRelationUrl(): string {
    return this.nicoliveProgramStateService.state.httpRelation.url;
  }
  set httpRelationUrl(url: string) {
    this.nicoliveProgramStateService.updateHttpRelation({ url });
  }
  get httpRelationBody(): string {
    return this.nicoliveProgramStateService.state.httpRelation.body;
  }
  set httpRelationBody(body: string) {
    this.nicoliveProgramStateService.updateHttpRelation({ body });
  }

  testHttpRelation() {
    HttpRelation.sendTest(this.nicoliveProgramStateService.state.httpRelation).then();
  }

  showHttpRelationPage() {
    remote.shell.openExternal('https://github.com/n-air-app/n-air-app/wiki/http_relation');
  }

  // ---------------------------------------

  voicevoxItems: VoicevoxItem[] = [];
  voicevoxNormalItem: VoicevoxItem = { id: '', name: '' };
  voicevoxSystemItem: VoicevoxItem = { id: '', name: '' };
  voicevoxOperatorItem: VoicevoxItem = { id: '', name: '' };

  voicevoxIcons: { [id: string]: string } = {};
  voicevoxNormalIcon = '';
  voicevoxSystemIcon = '';
  voicevoxOperatorIcon = '';

  voicevoxSystemSpeed = 1;

  @Watch('voicevoxNormalItem')
  onChangevoicevoxForNormal() {
    const id = this.voicevoxNormalItem.id;
    this.nicoliveCommentSynthesizerService.voicevoxNormal = { id };
    this.getVoicevoxIcon(id).then(a => (this.voicevoxNormalIcon = a));
  }
  @Watch('voicevoxSystemItem')
  onChangevoicevoxForSystem() {
    const id = this.voicevoxSystemItem.id;
    this.nicoliveCommentSynthesizerService.voicevoxSystem = { id };
    this.getVoicevoxIcon(id).then(a => (this.voicevoxSystemIcon = a));
  }
  @Watch('voicevoxOperatorItem')
  onChangevoicevoxForOperator() {
    const id = this.voicevoxOperatorItem.id;
    this.nicoliveCommentSynthesizerService.voicevoxOperator = { id };
    this.getVoicevoxIcon(id).then(a => (this.voicevoxOperatorIcon = a));
  }

  @Watch('voicevoxSystemSpeed')
  onChangevoicevoxSpeed() {
    console.log(`speed to ${this.voicevoxSystemSpeed}`);
    const speed = this.voicevoxSystemSpeed;
    this.nicoliveCommentSynthesizerService.voicevoxSystem = { speed };
  }

  async readVoicevoxList() {
    try {
      const list: VoicevoxItem[] = [];
      const json = await (await fetch(`${VoicevoxURL}/speakers`)).json();
      for (const item of json) {
        const name = item['name'];
        const uuid = item['speaker_uuid'];
        for (const style of item['styles']) {
          const id = style['id'];
          const sn = style['name'];
          if (id === undefined || sn === undefined || style['type'] !== 'talk') continue;
          list.push({ id, uuid, name: `${name} ${sn}` });
        }
      }
      if (!list.length) return;
      this.voicevoxItems = list;
      this.voicevoxNormalItem = this.getVoicevoxItem(
        this.nicoliveCommentSynthesizerService.voicevoxNormal.id,
      );
      this.voicevoxSystemItem = this.getVoicevoxItem(
        this.nicoliveCommentSynthesizerService.voicevoxSystem.id,
      );
      this.voicevoxOperatorItem = this.getVoicevoxItem(
        this.nicoliveCommentSynthesizerService.voicevoxOperator.id,
      );

      this.voicevoxSystemSpeed = this.nicoliveCommentSynthesizerService.voicevoxSystem.speed ?? 1;

      console.log(JSON.stringify(list));
    } catch (e) {
      console.log(e);
    }
  }

  getVoicevoxItem(id: string): VoicevoxItem {
    return this.voicevoxItems.find(a => a.id === id) ?? { id: '', name: '' };
  }

  async getVoicevoxIcon(id: string) {
    if (this.voicevoxIcons[id]) return this.voicevoxIcons[id];

    const item = this.getVoicevoxItem(id);
    if (!item || !item.uuid) return '';

    try {
      const json = await (
        await fetch(`${VoicevoxURL}/speaker_info?resource_format=url&speaker_uuid=${item.uuid}`)
      ).json();
      for (const info of json.style_infos) {
        const id = info['id'];
        const icon = info['icon'];
        if (id === undefined || !icon) continue;
        this.voicevoxIcons[id] = icon;
      }
    } catch (e) {
      console.log(e);
    }

    console.log(JSON.stringify(this.voicevoxIcons));

    return this.voicevoxIcons[id] ?? '';
  }
}
