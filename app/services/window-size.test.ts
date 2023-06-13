import { createSetupFunction } from 'util/test-setup';
import { Subject, BehaviorSubject } from 'rxjs';

type WindowSizeService = import('./window-size').WindowSizeService;
type PanelState = import('./window-size').PanelState;
type TWindowSizeService = import('./window-size').WindowSizeService;

const setup = createSetupFunction({
  state: {},
  injectee: {
    NicoliveProgramStateService: {
      state: {},
      updated: {
        subscribe() {},
      },
    },
    WindowsService: {
      getWindow() {
        return {
          getMinimumSize: () => [800, 600],
          setMinimumSize: () => {},
          setMaximumSize: () => {},
          getSize: () => [800, 600],
          setSize: () => {},
          isMaximized: () => false,
          setMaximizable: () => {},
        };
      },
    },
    UserService: {
      userLoginState: {
        subscribe() {},
      },
      isLoggedIn: () => true,
    },
    CustomizationService: {
      settingsChanged: {
        subscribe() {},
      },
      state: {},
      setFullModeWidthOffset() {},
    },
    NavigationService: {
      navigated: {
        subscribe() {},
      },
      state: { currentPage: 'Studio' },
    },
  },
});

jest.mock('services/windows', () => ({ WindowsService: {} }));
jest.mock('services/user', () => ({ UserService: {} }));
jest.mock('services/nicolive-program/state', () => ({ NicoliveProgramStateService: {} }));

beforeEach(() => {
  jest.doMock('services/core/stateful-service');
  jest.doMock('services/core/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('get instance', () => {
  setup();
  const { WindowSizeService } = require('./window-size');
  expect(WindowSizeService.instance).toBeInstanceOf(WindowSizeService);
});

describe('static getPanelState', () => {
  const suites: [boolean | null, boolean | null, boolean | null, boolean, string | null][] = [
    // panelOpen, isLoggedIn, isCompact, isMaximized, expected
    [null, null, null, false, null],
    [null, true, null, false, null],
    [null, false, null, false, null],
    [true, null, null, false, null],
    [false, null, null, false, null],
    [true, false, false, false, 'INACTIVE'],
    [false, false, false, false, 'INACTIVE'],
    [true, true, false, false, 'OPENED'],
    [false, true, false, false, 'CLOSED'],
    [true, false, true, false, 'COMPACT'],
    [false, false, true, false, 'COMPACT'],
    [true, true, true, false, 'COMPACT'],
    [false, true, true, false, 'COMPACT'],
    [true, true, false, true, 'INACTIVE'],
    [false, true, false, true, 'INACTIVE'],
    [true, false, true, true, 'INACTIVE'],
    [false, false, true, true, 'INACTIVE'],
    [true, true, true, true, 'INACTIVE'],
    [false, true, true, true, 'INACTIVE'],
  ];

  for (const [panelOpened, isLoggedIn, isCompact, isNavigating, result] of suites) {
    test(`panelOpened: ${panelOpened}, isLoggedIn: ${isLoggedIn}`, () => {
      setup();
      const { WindowSizeService } = require('./window-size');

      expect(
        WindowSizeService.getPanelState({ panelOpened, isLoggedIn, isCompact, isNavigating }),
      ).toBe(result);
    });
  }
});

describe('refreshWindowSize', () => {
  const suites = [
    {
      persistentIsLoggedIn: true,
      persistentPanelOpened: true,
      isLoggedIn: true,
      states: ['OPENED'],
    },
    {
      persistentIsLoggedIn: true,
      persistentPanelOpened: true,
      isLoggedIn: false,
      states: ['OPENED', 'INACTIVE'],
    },
    {
      persistentIsLoggedIn: true,
      persistentPanelOpened: false,
      isLoggedIn: true,
      states: ['CLOSED'],
    },
    {
      persistentIsLoggedIn: true,
      persistentPanelOpened: false,
      isLoggedIn: false,
      states: ['CLOSED', 'INACTIVE'],
    },
    {
      persistentIsLoggedIn: false,
      persistentPanelOpened: true,
      isLoggedIn: true,
      states: ['INACTIVE', 'OPENED'],
    },
    {
      persistentIsLoggedIn: false,
      persistentPanelOpened: false,
      isLoggedIn: true,
      states: ['INACTIVE', 'CLOSED'],
    },
  ];

  for (const suite of suites) {
    const name = [
      suite.persistentIsLoggedIn ? 'ログイン中' : '未ログイン',
      'で',
      suite.persistentPanelOpened ? 'パネル展開状態' : 'パネル収納状態',
      'を復元し、',
      ['ログインチェックに成功', 'ログインチェックに失敗', '手動ログイン', 'ログインせず'][
        (suite.persistentIsLoggedIn ? 0 : 2) + (suite.isLoggedIn ? 1 : 0)
      ],
      ' → ',
      suite.states.join('/'),
    ].join('');
    test(name, () => {
      const userLoginState = new Subject();
      const updated = new BehaviorSubject({
        panelOpened: suite.persistentPanelOpened,
      });
      const setMinimumSize = jest.fn();
      const setMaximumSize = jest.fn();
      const setSize = jest.fn();
      setup({
        injectee: {
          UserService: {
            userLoginState,
            isLoggedIn: () => suite.persistentIsLoggedIn,
          },
          NicoliveProgramStateService: {
            state: {},
            updated,
          },
          WindowsService: {
            getWindow() {
              return {
                getMinimumSize: () => [800, 600],
                setMinimumSize,
                setMaximumSize,
                getSize: () => [800, 600],
                setSize,
                isMaximized: () => false,
                setMaximizable: () => {},
              };
            },
          },
          NavigationService: {
            navigated: new Subject(),
            state: { currentPage: 'Studio' },
          },
        },
      });

      const { WindowSizeService } = require('./window-size');
      const updateWindowSize = jest.fn();
      // inject spy
      WindowSizeService.updateWindowSize = updateWindowSize;

      // kick getter
      WindowSizeService.instance;

      userLoginState.next(suite.isLoggedIn);

      suite.states.forEach((item, index, arr) => {
        expect(updateWindowSize).toHaveBeenNthCalledWith(
          index + 1,
          expect.anything(),
          arr[index - 1] || null,
          item,
          {
            backupHeight: undefined,
            backupX: undefined,
            backupY: undefined,
            widthOffset: undefined,
          },
        );
      });
      expect(updateWindowSize).toHaveBeenCalledTimes(suite.states.length);
    });
  }
});

describe('updateWindowSize', () => {
  const states = ['INACTIVE', 'OPENED', 'CLOSED'] as (PanelState | null)[];
  const stateName = {
    null: '初期',
    INACTIVE: '未ログイン',
    OPENED: 'パネル展開',
    CLOSED: 'パネル収納',
    COMPACT: 'コンパクトモード',
  };
  const BASE_HEIGHT = 600;
  const BASE_WIDTH = 800;
  const SMALL_WIDTH = BASE_WIDTH - 1; // 800より小さくしておくと便利

  const initSuites: {
    prev: PanelState | null;
    next: PanelState;
    smallerThanMinWidth: boolean;
  }[] = [
    [null, 'INACTIVE', true],
    [null, 'INACTIVE', false],
    [null, 'CLOSED', true],
    [null, 'CLOSED', false],
    [null, 'OPENED', true],
    [null, 'OPENED', false],
    //@ts-ignore
  ].map(([prev, next, smallerThanMinWidth]: [PanelState | null, PanelState, boolean]) => ({
    prev,
    next,
    smallerThanMinWidth,
  }));

  for (const suite of initSuites) {
    test(`${stateName[suite.prev]}→${stateName[suite.next]} 最小幅より${
      suite.smallerThanMinWidth ? '小さい' : '大きい'
    }`, () => {
      setup();
      const { WindowSizeService } = require('./window-size');
      const { WINDOW_MIN_WIDTH } = WindowSizeService;
      const WIDTH = suite.smallerThanMinWidth
        ? SMALL_WIDTH
        : WINDOW_MIN_WIDTH[suite.next] || BASE_WIDTH;

      const win = {
        getMinimumSize: () => [WINDOW_MIN_WIDTH[suite.prev], BASE_HEIGHT],
        getSize: () => [WIDTH, BASE_HEIGHT],
        setMinimumSize: jest.fn(),
        setMaximumSize: jest.fn(),
        setSize: jest.fn(),
        isMaximized: () => false,
        setMaximizable: () => {},
      };

      WindowSizeService.updateWindowSize(win, suite.prev, suite.next);
      expect(win.setMinimumSize).toHaveBeenCalledTimes(1);
      expect(win.setMinimumSize).toHaveBeenNthCalledWith(
        1,
        WINDOW_MIN_WIDTH[suite.next],
        BASE_HEIGHT,
      );

      if (suite.smallerThanMinWidth) {
        expect(win.setSize).toHaveBeenCalledTimes(1);
        expect(win.setSize).toHaveBeenNthCalledWith(1, WINDOW_MIN_WIDTH[suite.next], BASE_HEIGHT);
      } else {
        expect(win.setSize).toHaveBeenCalledTimes(0);
      }
    });
  }

  const suites = [
    ['INACTIVE', 'CLOSED', false],
    ['INACTIVE', 'OPENED', false],
    ['CLOSED', 'OPENED', false],
    ['OPENED', 'CLOSED', false],
    ['OPENED', 'INACTIVE', false],
    ['CLOSED', 'INACTIVE', false],
    ['INACTIVE', 'CLOSED', true],
    ['INACTIVE', 'OPENED', true],
    ['CLOSED', 'OPENED', true],
    ['OPENED', 'CLOSED', true],
    ['OPENED', 'INACTIVE', true],
    ['CLOSED', 'INACTIVE', true],
    //@ts-ignore
  ].map(([prev, next, isMaximized]: [PanelState, PanelState, boolean]) => ({
    prev,
    next,
    isMaximized,
  }));
  const WIDTH_DIFF = 32;

  for (const suite of suites) {
    test(`${stateName[suite.prev]}→${stateName[suite.next]} ${
      suite.isMaximized ? '最大化中は幅が変わらない' : '変化量を維持して幅を更新する'
    }`, () => {
      setup();
      const { WindowSizeService } = require('./window-size');
      const { WINDOW_MIN_WIDTH } = WindowSizeService;

      const win = {
        getMinimumSize: () => [WINDOW_MIN_WIDTH[suite.prev], BASE_HEIGHT],
        getSize: () => [WINDOW_MIN_WIDTH[suite.prev] + WIDTH_DIFF, BASE_HEIGHT],
        setMinimumSize: jest.fn(),
        setMaximumSize: jest.fn(),
        setSize: jest.fn(),
        isMaximized: () => suite.isMaximized,
        setMaximizable: jest.fn(),
      };

      WindowSizeService.updateWindowSize(win, suite.prev, suite.next);

      expect(win.setMinimumSize).toHaveBeenCalledTimes(1);
      expect(win.setMinimumSize).toHaveBeenNthCalledWith(
        1,
        WINDOW_MIN_WIDTH[suite.next],
        BASE_HEIGHT,
      );

      if (suite.isMaximized) {
        expect(win.setSize).toHaveBeenCalledTimes(0);
      } else {
        expect(win.setSize).toHaveBeenCalledTimes(1);
        expect(win.setSize).toHaveBeenNthCalledWith(
          1,
          WINDOW_MIN_WIDTH[suite.next] + WIDTH_DIFF,
          BASE_HEIGHT,
        );
      }
    });
  }

  const compactSuites = [
    ['INACTIVE', 'COMPACT', true, false, true, false],
    ['CLOSED', 'COMPACT', true, false, true, false],
    ['OPENED', 'COMPACT', true, false, true, false],
    ['COMPACT', 'INACTIVE', false, true, false, true],
    ['COMPACT', 'CLOSED', false, true, false, true],
    ['COMPACT', 'OPENED', false, true, false, true],
    ['INACTIVE', 'COMPACT', false, false, false, false],
    ['CLOSED', 'COMPACT', false, false, false, false],
    ['OPENED', 'COMPACT', false, false, false, false],
    ['COMPACT', 'INACTIVE', false, false, false, false],
    ['COMPACT', 'CLOSED', false, false, false, false],
    ['COMPACT', 'OPENED', false, false, false, false],
  ].map(
    //@ts-ignore
    ([prev, next, isMaximized, maximize, unmaximize, backupMaximized]: [
      PanelState,
      PanelState,
      boolean,
      boolean,
      boolean,
      boolean,
    ]) => ({
      prev,
      next,
      isMaximized,
      maximize,
      unmaximize,
      backupMaximized,
    }),
  );

  for (const suite of compactSuites) {
    test(`${stateName[suite.prev]}${suite.isMaximized ? '(最大化状態)' : ''}→${
      stateName[suite.next]
    }${suite.backupMaximized ? '(最大化保存状態)' : ''} 最大化切り替え管理`, () => {
      setup();
      const { WindowSizeService } = require('./window-size');
      const { WINDOW_MIN_WIDTH } = WindowSizeService;

      const win = {
        getMinimumSize: () => [WINDOW_MIN_WIDTH[suite.prev], BASE_HEIGHT],
        getPosition: () => [0, 0],
        getSize: () => [WINDOW_MIN_WIDTH[suite.prev] + WIDTH_DIFF, BASE_HEIGHT],
        setMinimumSize: jest.fn(),
        setMaximumSize: jest.fn(),
        setSize: jest.fn(),
        isMaximized: () => suite.isMaximized,
        maximize: jest.fn(),
        unmaximize: jest.fn(),
        setMaximizable: jest.fn(),
      };

      const nextSize = WindowSizeService.updateWindowSize(win, suite.prev, suite.next, {
        maximized: suite.backupMaximized,
      });

      expect(nextSize.maximized).toEqual(suite.isMaximized);

      expect(win.maximize).toHaveBeenCalledTimes(suite.maximize ? 1 : 0);
      expect(win.unmaximize).toHaveBeenCalledTimes(suite.unmaximize ? 1 : 0);
      expect(win.setMaximizable).toHaveBeenCalledWith(suite.next !== 'COMPACT');
    });
  }
});
