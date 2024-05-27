import { StatefulService, mutation } from 'services/core';
import { NicoliveClient, isOk } from './NicoliveClient';
import { Subject } from 'rxjs';

interface INicoliveSupportersService {
  // moderator の userId 集合
  supporterIds: string[];
}

export class NicoliveSupportersService extends StatefulService<INicoliveSupportersService> {
  private client = new NicoliveClient({});

  static initialState: INicoliveSupportersService = {
    supporterIds: [],
  };
  private stateChangeSubject = new Subject<typeof this.state>();

  async update(): Promise<string[]> {
    const limit = 1000;
    const supporterIds: string[] = [];

    for (let offset = 0; ; offset += limit) {
      const response = await this.client.fetchSupportersList({ limit, offset });
      if (!isOk(response)) {
        // TODO エラーハンドリング
        break;
      }
      const value = response.value;

      supporterIds.push(...value.supporterIds);
      if (value.supporterIds.length < limit || supporterIds.length >= value.totalCount) {
        break;
      }
    }
    this.setState({ supporterIds });
    return supporterIds;
  }

  private setState(state: INicoliveSupportersService) {
    this.SET_STATE(state);
    this.stateChangeSubject.next(state);
  }

  @mutation()
  private SET_STATE(nextState: INicoliveSupportersService) {
    this.state = nextState;
  }
}
