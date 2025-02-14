import Vue from 'vue';
import * as comps from './index';
import { TObsType } from './ObsInput';
import TsxComponent from 'components/tsx-component';

const inputComponents = comps as any as { [key: string]: typeof TsxComponent };

export function propertyComponentForType(type: TObsType): typeof TsxComponent {
  const componentName = Object.keys(inputComponents).find(name => {
    // @ts-expect-error ts7053
    const componentObsType = inputComponents[name]['obsType'];
    return Array.isArray(componentObsType)
      ? componentObsType.includes(type)
      : componentObsType === type;
  });
  if (!componentName) console.warn('Component not found. Type:', type);
  return inputComponents[componentName];
}
