import _ from 'lodash';
import createServiceChaos from 'utils/createServiceChaos';
import { BaseModel, dvaModel, effect, reducer } from 'utils/libs/sre-utils-dva';
import { IBasicInfo, IExpertise, IExpertiseId, ITems } from 'config/interfaces/Chaos/expertiseEditor';
import { ICronExpression, IFlowGroup, INode } from 'config/interfaces/Chaos/experiment';
import { NODE_TYPE } from 'pages/Chaos/lib/FlowConstants';
import { convertFlow, convertNode } from './experimentInit';
import { v4 as uuidv4 } from 'uuid';

interface IExpertiseEditorState {
  expertise: IExpertise;
}

const DEFAULT_STATE: IExpertiseEditorState = {
  expertise: {
    expertise_id: '',
    basic_info: {
      background_desc: '',
      design_concept: '',
      function_desc: '',
      name: '',
      tags: [],
    },
    evaluation_info: {
      items: [{
        id: uuidv4(),
        desc: '',
      }],
    },
    executable_info: {
      flow: {
        experimentId: '',
        runMode: 'SEQUENCE',
        state: '',
        duration: 900,
        schedulerConfig: {
          cronExpression: '',
        },
        flowGroups: [],
        guardConf: {
          guards: [],
        },
      },
      run_time: {
        items: [],
      },
    },
    // observerNodes: [],
    // recoverNodes: [],
  },
};

@dvaModel('expertiseEditor')
class ExpertiseEditor extends BaseModel {

  state: IExpertiseEditorState = DEFAULT_STATE;

  @reducer
  setClearExpertise() {
    return {
      ...this.state,
      expertise: {
        expertise_id: '',
        basic_info: {
          background_desc: '',
          design_concept: '',
          function_desc: '',
          name: '',
          tags: [],
        },
        evaluation_info: {
          items: [{
            id: uuidv4(),
            desc: '',
          }],
        },
        executable_info: {
          flow: {
            experimentId: '',
            runMode: 'SEQUENCE',
            state: '',
            duration: 900,
            schedulerConfig: {
              cronExpression: '',
            },
            flowGroups: [],
            guardConf: {
              guards: [],
            },
          },
          run_time: {
            items: [],
          },
        },
      },
    };
  }

  @reducer
  setExpertise(payload: IExpertiseEditorState['expertise']) {

    const { expertise } = this.state;
    const result = { ...payload };
    const observerNodes = _.get(result, 'observerNodes', []);
    const recoverNodes = _.get(result, 'recoverNodes', []);
    const flow = _.get(result, 'executable_info.flow', {});
    const basicInfo = _.get(result, 'basic_info', {});
    const evaluationInfo = _.get(result, 'evaluation_info', { items: [] });

    const runTime = _.get(result, 'executable_info.run_time', {});
    const exResult = convertFlow(observerNodes, recoverNodes, flow, true);
    const observerNodesList = _.get(exResult, 'observerNodes', []);
    const recoverNodesList = _.get(exResult, 'recoverNodes', []);

    if (!_.isEmpty(evaluationInfo.items)) {
      Array.from(evaluationInfo.items).map((it: ITems) => {
        if (!it.id) {
          it.id = uuidv4();
        }
        return it;
      });
      _.set(expertise, 'evaluation_info', evaluationInfo);
    } else {
      _.set(expertise, 'evaluation_info', { items: [{ id: uuidv4() }] });
    }
    expertise.expertise_id = result.expertise_id;
    return {
      ...this.state,
      expertise: {
        ...expertise,
        basic_info: { ...basicInfo },
        executable_info: {
          flow: { ...flow },
          run_time: { ...runTime },
        },
        observerNodes: observerNodesList,
        recoverNodes: recoverNodesList,
      },
    };
  }

  @reducer
  setUpdateBasicInfo(payload: IBasicInfo) {
    const { expertise } = this.state;
    return {
      ...this.state,
      expertise: {
        ...expertise,
        basic_info: { ...payload },
      },
    };
  }

  @reducer
  setAddOrUpdateExpertiseFlowGroup(payload: IFlowGroup) {
    const { expertise } = this.state;
    const flowGroup = { ...payload };
    // ????????????id?????????1???
    if (!flowGroup.id) {
      flowGroup.id = uuidv4();
    }

    let flowGroups = _.get(expertise, 'executable_info.flow.flowGroups', []);
    const exist = _.filter(flowGroups, (fg: IFlowGroup) => fg.id === flowGroup.id);
    if (!_.isEmpty(exist)) {
      flowGroups = _.map(flowGroups, (fg: IFlowGroup) => {
        if (fg.id === flowGroup.id) {
          return flowGroup;
        }
        return fg;
      });
    } else {
      flowGroups = [ ...flowGroups, flowGroup ];
    }

    _.set(expertise, 'executable_info.flow.flowGroups', flowGroups);
    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setChangeExpertiseRunMode(payload: string) {
    const { expertise } = this.state;
    const _expertise = _.set(expertise, 'executable_info.flow.runMode', payload);
    return {
      ...this.state,
      expertise: {
        ..._expertise,
      },
    };
  }

  @reducer
  setChangeExpertiseTimeOut(payload: number | undefined) {
    const { expertise } = this.state;
    _.set(expertise, 'executable_info.flow.duration', payload);

    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setDeleteExpertiseGuardNode(node: INode) {
    const { expertise } = this.state;
    const { observerNodes, recoverNodes } = expertise;

    // ???????????? experiment.flow.guardConf.guards???????????????????????????undefined??????
    let guards = _.get(expertise, 'executable_info.flow.guardConf.guards', []);

    if (node.id) {
      // ?????????????????????
      if (node.nodeType === NODE_TYPE.OBSERVER) {
        expertise.observerNodes = _.filter(observerNodes, (n: INode) => n.id !== node.id);
      } else if (node.nodeType === NODE_TYPE.RECOVER) {
        expertise.recoverNodes = _.filter(recoverNodes, (n: INode) => n.id !== node.id);
      }

      // ?????????????????????
      guards = _.filter(guards, (n: INode) => n.id !== node.id);
      _.set(expertise, 'executable_info.flow.guardConf.guards', guards);
    }

    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setExpertiseSchedulerConfig(payload: ICronExpression) {
    const { expertise } = this.state;

    _.set(expertise, 'executable_info.flow.schedulerConfig', payload);
    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setAddOrUpdateExpertiseGuardNode(node: INode) {
    const { expertise } = this.state;

    // ???????????????
    expertise.observerNodes = expertise.observerNodes || [];
    expertise.recoverNodes = expertise.recoverNodes || [];

    if (!_.get(expertise, 'executable_info.flow.guardConf.guards')) {
      _.set(expertise, 'executable_info.flow.guardConf.guards', []);
    }

    const { observerNodes, recoverNodes } = expertise;
    let guards = _.get(expertise, 'executable_info.flow.guardConf.guards', []);
    // ????????????id?????????1???
    // ??????????????????????????????node.functionId?????????????????????functionId?????????????????????????????????????????????
    if (!node.id) {
      node.id = uuidv4();
    }

    // ?????????????????????
    let rawNodes: INode[] = [];
    if (node.nodeType === NODE_TYPE.OBSERVER) {
      rawNodes = observerNodes;
    } else if (node.nodeType === NODE_TYPE.RECOVER) {
      rawNodes = recoverNodes;
    }

    let exist: INode[] | undefined = _.filter(rawNodes, (n: INode) => n.id === node.id);

    if (!_.isEmpty(exist)) {
      rawNodes = _.map(rawNodes, (n: INode) => {
        if (n.id === node.id) {
          return node;
        }
        return n;
      });
    } else {
      rawNodes = [ ...rawNodes, node ];
    }

    if (node.nodeType === NODE_TYPE.OBSERVER) {
      expertise.observerNodes = rawNodes;
    } else if (node.nodeType === NODE_TYPE.RECOVER) {
      expertise.recoverNodes = rawNodes;
    }

    // ????????????????????????
    exist = undefined;
    exist = _.filter(guards, (n: INode) => n.id === node.id);

    if (!_.isEmpty(exist)) {
      guards = _.map(guards, (n: INode) => {
        if (n.id === node.id) {
          return convertNode(node);
        }
        return n;
      });
    } else {
      guards = [ ...guards, convertNode(node) ];
    }

    _.set(expertise, 'executable_info.flow.guardConf.guards', guards);
    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setUpdateRunTime(payload: string) {
    const { expertise } = this.state;
    _.set(expertise, 'executable_info.run_time.items', payload);
    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @reducer
  setUpdateEvaluating(payload: any) {
    const { expertise } = this.state;
    const item = { ...payload };

    if (!_.get(expertise, 'evaluation_info.items')) {
      _.set(expertise, 'evaluation_info.items', []);
    }

    if (!item.id) {
      item.id = uuidv4();
    }

    let evaluationInfos = _.get(expertise, 'evaluation_info.items', [{}]);
    if (!_.isEmpty(item)) {
      if (!_.isEmpty(evaluationInfos)) {
        const exit = _.find(evaluationInfos, (e: ITems) => e.id === item.id);
        if (exit) {
          evaluationInfos.map((e: ITems) => {
            if (e.id === item.id) {
              e.desc = item.desc;
            }
            return e;
          });
        } else {
          evaluationInfos = _.concat(evaluationInfos, item);
        }
      } else {
        evaluationInfos = _.concat(evaluationInfos, item);
      }
      expertise.evaluation_info.items = evaluationInfos;
      return {
        ...this.state,
        expertise: {
          ...expertise,
        },
      };
    }

    return { ...this.state };
  }

  @reducer
  setDeleteEvaluating(payload: any) {
    const { expertise } = this.state;

    const evaluationInfos = _.get(expertise, 'evaluation_info.items', [{}]);
    const evaluationList = _.filter(evaluationInfos, (eva: ITems) => eva.id !== payload.id);
    expertise.evaluation_info.items = evaluationList;
    return {
      ...this.state,
      expertise: {
        ...expertise,
      },
    };
  }

  @effect()
  *getExpertise(payload: IExpertiseId, callback: (res: any) => void) {
    const { Data } = yield this.effects.call(createServiceChaos('QueryExpertiseDetails'), payload);
    if (Data.executable_info?.flow?.guardConf?.guards) {
      Data.executable_info.flow.guardConf.guards.map((item: any) => {
        if (item.actionType === 0) {
          item.arguments = [{
            argumentList: item.arguments,
            gradeName: '??????',
          }];
        }
        return item;
      });
    }
    callback && callback(Data);
    yield this.effects.put(this.setExpertise(Data));
  }

  @effect()
  *updateExpertise(payload: IExpertise, callback: (res: any) => void) {
    payload.executable_info?.flow?.guardConf?.guards?.map((item: any) => {
      if (item.actionType === 0) {
        item.arguments = item.arguments[0].argumentList;
      }
      return item;
    });
    const { Data } = yield this.effects.call(createServiceChaos('UpdateExpertise'), payload);
    callback && callback(Data);
  }

  @effect()
  *createExpertise(payload: IExpertise, callback: (res: any) => void) {
    payload.executable_info?.flow?.guardConf?.guards?.map((item: any) => {
      if (item.actionType === 0) {
        item.arguments = item.arguments[0].argumentList;
      }
      return item;
    });
    const { Data } = yield this.effects.call(createServiceChaos('CreateExpertise'),
      payload);
    callback && callback(Data);
  }

  // ????????????
  @effect()
  *cloneExperience(payload: any, callback: () => void) {
    const { Data } = yield this.effects.call(createServiceChaos('CloneExpertise'),
      payload);
    callback && callback();
    yield this.effects.put(this.setExpertise(Data));
  }
}

export default new ExpertiseEditor().model;

declare global {
  interface Actions {
    expertiseEditor: ExpertiseEditor;
  }
}
