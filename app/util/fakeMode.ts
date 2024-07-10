import { IPlatformAuth } from 'services/platforms';

// 開発テスト用
export function isFakeMode(): boolean {
  return !!process.env.DEV_SERVER || !!process.env.NAIR_FAKE_PROGRAM;
}

export const FakeUserAuth: IPlatformAuth = {
  apiToken: 'fake',
  platform: {
    type: 'niconico',
    username: 'fake',
    token: 'fake',
    id: '2',
    userIcon: '',
  },
};
