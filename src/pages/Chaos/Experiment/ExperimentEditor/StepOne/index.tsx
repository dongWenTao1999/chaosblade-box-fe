import CopyHostDialog from './copyHostDialog';
import FlowGroupEditor from './FlowGroup';
import InvalidHostsDialog from './FlowGroup/ScopeLists/InvalidHostsDialog';
import ParameterUtil from 'pages/Chaos/lib/ParameterUtil';
import React, { useEffect, useState } from 'react';
import Translation from 'components/Translation';
import _ from 'lodash';
import i18n from '../../../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';
import { Balloon, Button, Dialog, Icon, Message } from '@alicloud/console-components';
import { IExperiment, IFlow, IFlowGroup, IHost, INode } from 'config/interfaces/Chaos/experiment';
import { SCOPE_TYPE, SELECT_TYPE } from 'pages/Chaos/lib/FlowConstants';
import { decorateFlow } from 'pages/Chaos/lib/FlowGroupDecorate';
import { useDispatch, useSelector } from 'utils/libs/sre-utils-dva';


const DEFAULT_GROUP_NAME = i18n.t('Default grouping').toString();

interface StepOneProps {
  isEdit: boolean;
  onNext: () => void;
  onBack: () => void;
  experiment?: IExperiment;
  isExpertise: boolean;
}

function StepOne(props: StepOneProps) {
  const dispatch = useDispatch();
  const experiment = useSelector(({ experimentEditor }) => experimentEditor.experiment);
  const expertise = useSelector(({ expertiseEditor }) => expertiseEditor.expertise, (preProps, state) => {
    return preProps === state;
  });

  const [ draftFlowGroup, setDraftFlowGroup ] = useState<IFlowGroup | null>(null);
  const [ isUpdate, setIsUpdate ] = useState(false);
  const [ targetFlowGroup, setTargetFlowGroup ] = useState<IFlowGroup | null>(null);
  const [ copyVisible, setCopyVisible ] = useState(false);

  useEffect(() => {
    initDraftFlowGroup(getFlowGroups());
  }, []);

  useEffect(() => {
    const flowGroups = getFlowGroups();
    if (!isUpdate && !_.isEmpty(flowGroups) && !_.isEmpty(draftFlowGroup)) {
      setIsUpdate(true);
      initDraftFlowGroup(flowGroups);
    }
  });

  function getFlowGroups() {
    let flowGroups = [];
    if (props.isExpertise) {
      flowGroups = _.get(expertise, 'executable_info.flow.flowGroups', []);
    } else {
      if (_.isEmpty(experiment)) {
        return [];
      }
      flowGroups = _.get(experiment, 'flow.flowGroups', []);
    }

    // ??????????????????????????????????????????????????????????????????????????????StepTwo??????????????????????????????????????????
    const copyFlowGroups = flowGroups.slice();

    // ?????????????????????????????????
    _.forEach(copyFlowGroups, (flowGroup: IFlowGroup, index: number) => {
      flowGroup.displayIndex = index + 1;
    });
    return copyFlowGroups;
  }

  function initDraftFlowGroup(flowGroups: IFlowGroup[]) {
    if (_.isEmpty(flowGroups)) {
      setDraftFlowGroup({
        groupId: null,
        groupName: DEFAULT_GROUP_NAME,
        scopeType: NaN,
        flows: [],
        hosts: [],
        selectType: SELECT_TYPE.IPS,
      });
    } else {
      // ?????????????????????1????????????????????????????????????decorate???????????????????????????flowGroups??????patch
      const draftFlowGroupNew = _.cloneDeep(flowGroups[0]);
      setDraftFlowGroup(draftFlowGroupNew);
    }

    _.forEach(flowGroups, (flowGroup: IFlowGroup) => {
      const flows = _.get(flowGroup, 'flows', []);
      _.forEach(flows as IFlow[], (flow: IFlow) => decorateFlow(flow));

      const { isExpertise } = props;
      if (isExpertise) {
        dispatch.expertiseEditor.setAddOrUpdateExpertiseFlowGroup({ ...flowGroup });
      } else {
        dispatch.experimentEditor.setAddOrUpdateFlowGroup({ ...flowGroup });
      }
    });
  }

  function getFlowGroupCount() {
    if (_.isEmpty(experiment)) {
      return [];
    }
    const flowGroups = _.get(experiment, 'flow.flowGroups', []);
    return flowGroups.length;
  }

  function handleFlowGroupAdd() {
    if (!_.isEmpty(draftFlowGroup)) {
      Message.error(i18n.t('Please save or cancel editing'));
      return;
    }

    const flowGroupCount = getFlowGroupCount();
    setDraftFlowGroup({
      groupId: '',
      groupName: flowGroupCount > 0 ? '' : DEFAULT_GROUP_NAME,
      flows: [],
      hosts: [],
    });
  }

  function handleCheckAll(e: any) {
    e.stopPropagation();
  }

  function handleFlowGroupEdit(flowGroup: IFlowGroup) {
    if (!draftFlowGroup) {
      setDraftFlowGroup(flowGroup);
    }
    return;
  }

  function handleScope(val: IHost) {
    let label;
    if (val.scopeType === SCOPE_TYPE.HOST || val.app) {
      label = `${val.ip}[${val.deviceName}]`;
    } else {
      if (val && !_.isEmpty(val.clusterName)) {
        label = `[K8S] ${val.clusterName}`;
      } else {
        label = `[K8S] ${val.clusterId}`;
      }
    }
    return label;
  }

  function handleIpBlock(ips: any[], more: boolean) {
    let value;
    if (more) {
      value = ips.slice(0, 5);
    } else {
      value = ips;
    }
    return <div className={styles.ipList}>
      {value.map(it => {
        return <div className={styles.ipBlock} key={it.app ? it.appConfigurationId : it.deviceConfigurationId} title={handleScope(it)}></div>;
      })}
      {more && <span style={{ marginRight: 12 }}>...</span>}
      <Balloon
        trigger={<div className={styles.allCheck} onClick={e => handleCheckAll(e)}><Translation>View all</Translation></div>}
        align="t"
        alignEdge
        triggerType="click"
      >
        {ips.map(it => {
          return <li key={it.app ? it.appConfigurationId : it.deviceConfigurationId} className={styles.ipListBallon}>
            {handleScope(it)}
          </li>;
        })}
      </Balloon>
    </div>;
  }

  function handleScopeList(value: IHost[] = []) {
    if (value && value.length === 1) {
      return value.map((it, i) => (<Balloon trigger={<div className={styles.ip}>{handleScope(it)}</div>} key={i}>
        <div>{handleScope(it)}</div>
      </Balloon>));
    }
    if (value && value.length > 1 && value.length <= 5) {
      return handleIpBlock(value, false);
    }
    return handleIpBlock(value, true);
  }

  // ?????? ExperimentFlowGroups
  function getExperimentFlowGroups() {
    let flowGroups;
    if (props.isExpertise) {
      flowGroups = _.get(expertise, 'executable_info.flow.flowGroups', []);
    } else {

      flowGroups = _.get(experiment, 'flow.flowGroups', []);
    }

    return flowGroups;
  }

  function handleFlowGroupDelete(e: any, flowGroup: IFlowGroup) {
    e.stopPropagation();
    Dialog.confirm({
      title: i18n.t('Confirm deletion').toString(),
      content: i18n.t('After confirmation, the group will be deleted and cannot be recovered, please operate with caution').toString(),
      onOk: () => {
        dispatch.experimentEditor.setUpdateFlowGroups(_.filter(getExperimentFlowGroups(), (fg: IFlowGroup) => fg.id !== flowGroup.id) as any);
      },
      onCancel: () => console.log('cancel'),
      locale: locale().Dialog,
    });
  }

  // ??????????????????
  function handleFlowGroupCopy(e: any, flowGroup: IFlowGroup) {
    e.stopPropagation();
    flowGroup && setTargetFlowGroup(flowGroup);
    setCopyVisible(true);
  }

  function handleClose() { setCopyVisible(false); }

  function renderFlowGroups(flowGroups: []) {
    if (_.isEmpty(flowGroups)) {
      return null;
    }
    return flowGroups.map((item: IFlowGroup) => {
      return <div className={styles.groups} onClick={() => handleFlowGroupEdit(item)} key={item && item.id}>
        <div className={styles.title}>
          <Icon type="arrow-right" className={styles.groupIcon}/>
          <div className={styles.groupName} title='11'>??????{item.displayIndex}???{item.groupName}</div>
        </div>
        <div className={styles.action}>
          <div>
            {item?.selectType === 2 && `${item.hostPercent || 0} %` || handleScopeList(item.hosts)}
          </div>
          <div>
            {!props.isExpertise && <Icon type="copy" className={styles.groupIpActionCopy} onClick={e => handleFlowGroupCopy(e, item)} title={i18n.t('Copy group')}/>}
            {!item.required && <Icon type="ashbin" className={styles.groupIpAction} onClick={e => handleFlowGroupDelete(e, item)} title={i18n.t('Delete group')}/>}
          </div>
        </div>
      </div>;
    });
  }

  function handleFlowGroupCancelEditing() {
    // ????????????
    setDraftFlowGroup(null);
  }

  // ????????????????????????
  function handleFlowGroupSave(flowGroup: IFlowGroup) {
    const { isExpertise } = props;

    // isExpertise: ????????????or????????????
    if (!isExpertise) {
      dispatch.experimentEditor.setAddOrUpdateFlowGroup(flowGroup);
    }

    // ????????????????????????
    if (isExpertise) {
      dispatch.expertiseEditor.setAddOrUpdateExpertiseFlowGroup(flowGroup);
    }

    // ???????????????????????????
    setDraftFlowGroup(null);
  }

  function handleNext() {
    const { isExpertise } = props;

    // ??????????????????
    let baseInfoErrorMessage = '';
    if (isExpertise) {
      // ????????????????????????
      const name = _.get(expertise, 'basic_info.name', '');
      const desc = _.get(expertise, 'basic_info.function_desc', '');
      const tags = _.get(expertise, 'basic_info.tags', []);

      // ????????????
      if (!name) {
        baseInfoErrorMessage = i18n.t('Please fill in the experience name').toString();
      } else if (!desc) {
        baseInfoErrorMessage = i18n.t('Please fill in the experience description');
      } else if (tags.length === 0) {
        baseInfoErrorMessage = i18n.t('Please fill in the experience tab');
      }
    } else {
      // ???????????????????????????
      const name = _.get(experiment, 'baseInfo.name', '');
      if (!name) {
        baseInfoErrorMessage = i18n.t('Please fill in the exercise name').toString();
      }
    }

    if (baseInfoErrorMessage) {
      Message.error(baseInfoErrorMessage);
      return;
    }

    // TODO: ???????????????????????????????????????flowGroup???handleSubmit?????????????????????????????????
    // ????????????????????????
    let index = 0;
    const flowGroups = getFlowGroups();
    for (const flowGroup of flowGroups) {
      ++index;

      const { appName, groupName, hosts, flows, hostPercent, selectType } = flowGroup;

      // ????????????????????????
      if (!groupName) {
        Message.error(`${i18n.t('Group')}${index}:${i18n.t('Please fill in the exercise name')}`);
        return;
      }

      // ????????????????????????
      if (!isExpertise) {
        if (selectType === SELECT_TYPE.IPS) {
          if (_.isEmpty(hosts)) {
            Message.error(`${i18n.t('Group')}${index}: ${i18n.t('Please select a machine list')}`);
            return;
          }
        }

        if (selectType === SELECT_TYPE.PERCENT && appName && !hostPercent) {
          Message.error(`${i18n.t('Group')}${index}:${i18n.t('Please select a machine percentage')}`);
          return;
        }
      }

      // ??????????????????
      if (_.isEmpty(flows)) {
        Message.error(`${i18n.t('Group')}${index}:${i18n.t('Please add a walkthrough')}`);
        return;
      }

      // ????????????????????????
      // ??????????????????????????????????????????????????????????????????
      let checkFailedNodes: IFlow[] = [];
      if (!isExpertise && flows) {
        _.forEach(flows, (f: IFlow) => {
          checkFailedNodes = _.concat(checkFailedNodes, handleNodesArgsCheck(f.prepare));
          checkFailedNodes = _.concat(checkFailedNodes, handleNodesArgsCheck(f.attack));
          checkFailedNodes = _.concat(checkFailedNodes, handleNodesArgsCheck(f.check));
          checkFailedNodes = _.concat(checkFailedNodes, handleNodesArgsCheck(f.recover));
        });
      }

      if (!_.isEmpty(checkFailedNodes)) {
        // ????????????????????????
        const errorNode = checkFailedNodes[0];
        Message.error(`${i18n.t('Group')}${index}???"${errorNode.activityName}"${i18n.t('Incorrect configuration of node parameters')}`);
        return;
      }
    }

    const { onNext } = props;
    onNext && onNext();
  }

  function handleNodesArgsCheck(nodes: INode[]) {
    return ParameterUtil.checkNodesArgs(nodes);
  }

  const { isEdit, isExpertise } = props;
  const flowGroups = getFlowGroups();
  let firstPartFlowGroups: any = [];
  let lastPartFlowGroups: any = [];
  let editingIndex = -1;
  if (draftFlowGroup && draftFlowGroup.id) {
    // ??????????????????????????????????????????????????????
    editingIndex = _.findIndex(flowGroups, (fg: IFlowGroup) => fg.id === draftFlowGroup.id);
  }
  firstPartFlowGroups = editingIndex === -1 ? [] : flowGroups.slice(0, editingIndex);
  lastPartFlowGroups = editingIndex === -1 ? flowGroups : flowGroups.slice(editingIndex + 1);
  const isDisable = _.isEmpty(getExperimentFlowGroups()) || !_.isEmpty(draftFlowGroup);
  return (
    <div>
      <Button
        type="primary"
        className={styles.addDrillOb}
        onClick={handleFlowGroupAdd}
      ><Translation>Add drill group</Translation></Button>
      {/* ??????id????????????????????????????????????????????? */}
      {draftFlowGroup && !draftFlowGroup.id &&
        <FlowGroupEditor
          {...props}
          data={draftFlowGroup}
          onSave={handleFlowGroupSave}
          onCancel={handleFlowGroupCancelEditing}
          onDisableCancel={!!_.isEmpty(flowGroups)}
          isExpertise={isExpertise} // ??????????????????
          isEdit={isEdit}
        />
      }
      { renderFlowGroups(firstPartFlowGroups) }
      {/* ???id???????????????????????????????????????????????????????????? */}
      {draftFlowGroup && draftFlowGroup.id &&
        <FlowGroupEditor
          {...props}
          data={draftFlowGroup}
          onSave={handleFlowGroupSave}
          onCancel={handleFlowGroupCancelEditing}
          onDisableCancel={!!_.isEmpty(flowGroups)}
          isExpertise={isExpertise}
          isEdit={isEdit}
        />
      }
      { renderFlowGroups(lastPartFlowGroups) }
      <div className='DividerEdit'></div>
      <Button
        onClick={handleNext}
        style={{ marginRight: '10px' }}
        type="primary"
        disabled={isDisable}
      >
        <Translation>Next step</Translation>
      </Button>
      {
        props.isEdit && <Button type='normal' onClick={props.onBack}><Translation>Cancel editing</Translation></Button>
      }
      {/* @ts-ignore */}
      <InvalidHostsDialog/>
      {!isExpertise && copyVisible && <CopyHostDialog
        visible={copyVisible}
        data={targetFlowGroup as IFlowGroup}
        onCloseCopy={handleClose}
      />}
    </div>
  );
}

export default StepOne;
