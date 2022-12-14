import 'reflect-metadata';
import i18n from '../../../i18n';
import { EffectsCommandMap } from './types';
import { MODEL } from './symbol';
import { modelsContainer } from './container';

export class BaseModel {

  protected effects!: EffectsCommandMap;
  originalState : any={};
  state:any = {};
  model = Reflect.getMetadata(MODEL, this);
  root: any = new Proxy(modelsContainer, {
    get(target, prop) {
      return target.get(prop as string);
    },
  });
  constructor() {
    if (new.target === BaseModel) {
      throw new Error(i18n.t('BaseModel cannot be instantiated'));
    }
    // eslint-disable-next-line
    const that = this;
    this.originalState = new Proxy({}, {
      get(target, prop) {
        return JSON.parse(JSON.stringify(that.state[prop]));
      },
    });
  }
}
