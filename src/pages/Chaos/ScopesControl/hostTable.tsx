import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import Translation from 'components/Translation';
import _ from 'lodash';
import classnames from 'classnames';
import formatDate from 'pages/Chaos/lib/DateUtil';
import i18n from '../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';

import Actions, { LinkButton } from '@alicloud/console-components-actions';
import ManualDialog from 'pages/Manage/AgentSetting/common/ManualDialog';
import { AGENT_STATUS, FILTER_TYPE, SCOPE_TYPE } from 'pages/Chaos/lib/FlowConstants';
import { IAppLicationScopeOrContorlRecord } from 'config/interfaces/Chaos/application';
import { pushUrl, removeParams } from 'utils/libs/sre-utils';
import { useHistory } from 'dva';

import {
  Icon,
  Message,
  Pagination,
  Search,
  Table,
} from '@alicloud/console-components';
import { useDispatch, useSelector } from 'utils/libs/sre-utils-dva';
interface IPorps {
  currTab: number;
  empty: any;
  changeSuccessNumber: (tab: number, info: string) => void; // 更新统计信息
}
const v_a_b_r = classnames({ [styles.v_a_b]: true, [styles.mr10]: true });
const v_a_b_r_r = classnames({ [styles.v_a_b]: true, [styles.mr10]: true, [styles.red]: true });

const HostTable: FC<IPorps> = props => {
  const { currTab, empty, changeSuccessNumber } = props;
  const pageSize = 10;
  const [ page, setPage ] = useState(1);
  const [ total, setTotal ] = useState(0);
  const [ filterValue, setFilterValue ] = useState('0');
  const [ searchKey, setSearchKey ] = useState('');
  const [ dataSource, setDataSource ] = useState<IAppLicationScopeOrContorlRecord[]>([]);
  const [ showManualDialog, setShowManualDialog ] = useState<boolean>(false); // 手动卸载弹框
  const [ pluginType, setPluginType ] = useState<string>('');
  const [ isUninstall, setIsUninstall ] = useState<boolean>(false);
  const [ isInstall, setIsInstall ] = useState<any>(undefined);
  const [ configurationId, setConfigurationId ] = useState<string>('');
  const [ ostype, setOsType ] = useState(NaN);

  const uninstallStatusLoopInterval = useRef<{ [key: string]: any }>({});
  const installStatusLoopInterval = useRef<{ [key: string]: any }>({});

  const { loading } = useSelector(state => {
    return {
      loading: state.loading.effects['scopesControl/getExperimentScopes'],
    };
  });
  const dispatch = useDispatch();
  const history = useHistory();
  useEffect(() => {
    setPage(1);
  }, [ currTab ]);
  useEffect(() => {
    if (currTab !== SCOPE_TYPE.HOST) {
      return;
    }
    getData();
  }, [ currTab, page, filterValue, searchKey ]);
  useEffect(() => {
    const successData = dataSource.filter((x: IAppLicationScopeOrContorlRecord) => x.agentStatus === AGENT_STATUS.ONLINE).length;
    changeSuccessNumber(currTab, `${successData}/${total}`);
  }, [ total ]);
  const getData = async () => {
    const { Data = false } = await dispatch.scopesControl.getExperimentScopes({
      scope_type: currTab,
      filter: {
        type: filterValue,
        key: searchKey,
      },
      size: pageSize,
      page,
    });
    const datas = _.get(Data, 'data', []);
    setDataSource(datas);
    setTotal(Data?.total || 0);
  };
  // 卸载
  const handleUninstall = useCallback(async (configurationId: string, deviceId: string) => {
    const { Data = false } = await dispatch.agentSetting.getUninstallPlugin({
      ConfigurationId: configurationId,
    });
    if (Data) {
      const _dataSource: IAppLicationScopeOrContorlRecord[] = _.cloneDeep(dataSource);
      _dataSource.forEach(item => {
        if (item.deviceId === deviceId) {
          item.pluginStatus = 4;
        }
      });
      // 更新状态为卸载中
      setDataSource(_dataSource);
      uninstallStatusLoopInterval.current[deviceId] = setInterval(() => {
        handleStatusLoop(dataSource, deviceId);
      }, 2000);

      setTimeout(() => {
        handleUninstallOvertime(dataSource, deviceId);
      }, 61000);
    }
  }, [ dataSource ]);
  // 卸载超时
  const handleUninstallOvertime = (_dataSource: IAppLicationScopeOrContorlRecord[], deviceId: string) => {
    if (!uninstallStatusLoopInterval.current[deviceId]) return;

    // 超时码999
    handleUninstallFailed(_dataSource, deviceId, 999);

    clearInterval(uninstallStatusLoopInterval.current[deviceId]);
    clearInterval(installStatusLoopInterval.current[deviceId]);
  };
  // 卸载失败
  const handleUninstallFailed = (dataSource: IAppLicationScopeOrContorlRecord[], deviceId: string, status?: number) => {
    const _dataSource: IAppLicationScopeOrContorlRecord[] = _.cloneDeep(dataSource);
    const pluginStatus = status || -1;

    _dataSource.forEach(item => {
      if (item.deviceId === deviceId) {
        item.pluginStatus = pluginStatus;
      }
    });

    setDataSource(_dataSource);
  };
  // 循环
  const handleStatusLoop = async (dataSource: IAppLicationScopeOrContorlRecord[], deviceId: string) => {
    const { Data = {} } = await dispatch.agentSetting.getQueryPluginStatus({
      Loop: true,
      InstanceId: deviceId,
    });
    if (!_.isEmpty(Data)) {
      const data = Data as IAppLicationScopeOrContorlRecord;
      const _dataSource: IAppLicationScopeOrContorlRecord[] = _.cloneDeep(dataSource);
      _dataSource.forEach(pluginItem => {
        if (pluginItem.deviceId === data.deviceId) {
          pluginItem.pluginStatus = data.pluginStatus;
        }
      });
      setDataSource(_dataSource);
      if (data.pluginStatus === 0) {
        clearInterval(uninstallStatusLoopInterval.current[deviceId]);
        uninstallStatusLoopInterval.current[deviceId] = null;
        getData();
      }
      if (data.pluginStatus === 2 || data.pluginStatus === -1) {
        clearInterval(installStatusLoopInterval.current[deviceId]);
        installStatusLoopInterval.current[deviceId] = null;
        getData();
      }
    }
  };

  // 手动卸载
  const toggleManualDialog = (pluginType: string, isUninstall: boolean, configurationId: string, ostype?: number | undefined) => {
    setShowManualDialog(!showManualDialog);
    setPluginType(pluginType);
    setIsUninstall(isUninstall);
    setConfigurationId(configurationId);
    setOsType(ostype!);
  };
  // 安装
  const handleInstall = useCallback(async (deviceId: string) => {
    const { Data = false, Code = '' } = await dispatch.agentSetting.getInstallPlugin({
      InstanceId: deviceId,
    });

    if (Data) {
      const _dataSource: IAppLicationScopeOrContorlRecord[] = _.cloneDeep(dataSource);
      _dataSource.forEach(item => {
        if (item.deviceId === deviceId) {
          item.pluginStatus = 1;
        }
      });

      // 更新状态为安装中
      setDataSource(_dataSource);

      installStatusLoopInterval.current[deviceId] = setInterval(() => {
        handleStatusLoop(dataSource, deviceId);
      }, 2000);

    } else {
      let msg = <Translation> Operation failed</Translation>;
      if (Code === 'plugin.instance.not.exist') {
        msg = <Translation>The current instance does not exist, please select an available instance</Translation>;
      }
      Message.error(msg);
    }
  }, [ dataSource ]);

  // 手动安装
  const onClickInstall = (pluginType: string, isUninstall: boolean, configurationId: string, ostype?: number | undefined) => {
    toggleManualDialog(pluginType, false, configurationId, ostype);
    setIsInstall(true);
  };

  /** table 操作 按钮 */
  const renderOption: any = (value: string, index: number, record: any) => {
    const { osType, pluginStatus, configurationId, pluginType, deviceId, canAutoInstall, installMode } = record;
    const btns: { [key: string]: JSX.Element } = {
      clickUninstallBtn: <LinkButton onClick={() => toggleManualDialog(pluginType, true, configurationId, osType)}>
        <Translation>Uninstall manually</Translation>
      </LinkButton>,
      autoUninstallBtn: <LinkButton onClick={() => handleUninstall(configurationId, deviceId)}>
        <Translation>Uninstall</Translation>
      </LinkButton>,
      // startOrStopBtn: <LinkButton onClick={() => handleEnableSwitch(record, index)}>{ enable ? '停止' : '开启' }</LinkButton>,
      installBtn: <span className={styles.red}><a className={styles.ml10} onClick={() => handleInstall(deviceId)} style={{ cursor: 'pointer' }}><Translation>Click install</Translation></a></span>,
      clinkInstallBtn: <span className={styles.red}><a className={styles.ml10} onClick={() => onClickInstall(pluginType, false, configurationId, osType)} style={{ cursor: 'pointer' }} ><Translation>Manual installation</Translation></a></span>,
      tryBtn: <LinkButton onClick={() => handleUninstall(configurationId, deviceId)}><Translation>Retry</Translation></LinkButton>,
      uninstallSuccess: <span className={v_a_b_r}><Translation>Uninstalled successfully</Translation> <Icon type={'success'} size="small" /></span>,
      installLoading: <span className={styles.mr10}><Translation>Installing</Translation> <Icon type={'loading'} size='small' /></span>,
      uninstallLoading: <span className={v_a_b_r}><Translation>Uninstalling</Translation> <Icon type={'loading'} size='small' /></span>,
      uninstallFault: <span className={v_a_b_r_r} ><Translation>Uninstall failed</Translation> <Icon type={'error'} size='small' /></span>,
      outTime: <span className={v_a_b_r_r}><Translation>Uninstall Timeout</Translation> <Icon type={'error'} size='small' /></span>,
    };
    let btnKeys: string[] = [];
    switch (pluginStatus) {
      case 0:
        btnKeys = [ 'uninstallSuccess' ];
        break;
      case 1:
        btnKeys = [ 'installLoading' ];
        break;
      case 2:
        btnKeys = [ 'monitorBtn' ];
        if (/CHAOS_AGENT/i.test(pluginType)) {
          btnKeys.push('startOrStopBtn');
        }
        btnKeys.push(canAutoInstall ? 'autoUninstallBtn' : 'clickUninstallBtn');
        break;
      case 3:
        btnKeys.push(canAutoInstall ? 'installBtn' : 'clinkInstallBtn');
        break;
      case 4:
        btnKeys = [ 'uninstallLoading' ];
        break;
      case 5:
        btnKeys = [ 'uninstallFault', 'tryBtn', 'clickUninstallBtn' ];
        break;
      case 999:
        btnKeys = [ 'outTime', 'tryBtn', 'clickUninstallBtn' ];
        break;
      case -1:
        btnKeys = [ 'uninstallFault', 'tryBtn', 'clinkInstallBtn' ];
        break;
      default:
        break;
    }
    return (
      <Actions style={{ justifyContent: 'center' }}>
        {btnKeys.map(item => btns[item])}
        <LinkButton onClick={() => {
          pushUrl(history, '/chaos/agentmanage/setting/tools', { id: configurationId, mode: installMode });
        }}><Translation>Install the walkthrough tool</Translation></LinkButton>
      </Actions>
    );
  };
  function handleFilterChange(value: any) {
    setFilterValue(value);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearchKey(value);
    setPage(1);
  }
  const renderName: any = (value: string, index: number, record: IAppLicationScopeOrContorlRecord) => {
    return <span className={styles.href} onClick={() => {
      pushUrl(history, '/chaos/experiment/scope/detail', {
        id: record.configurationId,
      });
      removeParams('configurationId');
    }}>{value}</span>;
  };

  const renderIsexperiment: any = (value: boolean) => {
    return value ? i18n.t('Yes') : i18n.t('No');
  };

  const renderStatus: any = (value: number) => {
    if (value === AGENT_STATUS.ONLINE) {
      return <span><Icon type="select" className={classnames(styles.onLineState, styles.icon)} /><Translation>Online</Translation></span>;
    }
    if (value === AGENT_STATUS.WAIT_INSTALL) {
      return <span><Icon type="minus-circle-fill" className={classnames(styles.icon, styles.notInstall)} /><Translation>Not Installed</Translation></span>;
    }

    if (value === AGENT_STATUS.OFFLINE) {
      return <span><Icon type="exclamationcircle-f" className={classnames(styles.icon, styles.offLineState)} /><Translation>Offline</Translation></span>;
    }
  };
  return (
    <div className={styles.tabContent}>
      <Search
        shape="simple"
        className={styles.searchContent}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        filter={FILTER_TYPE}
        filterValue={filterValue}
      />
      <Table
        primaryKey='deviceId'
        dataSource={loading ? [] : dataSource}
        hasBorder={false}
        emptyContent={empty}
        loading={loading}
        locale={locale().Table}
      >
        <Table.Column title={i18n.t('Host name').toString()} dataIndex='hostName' width={280} cell={renderName} />
        <Table.Column title={i18n.t('IP').toString()} dataIndex={'privateIp'} width={160} />
        <Table.Column title={i18n.t('Has it been drilled').toString()} dataIndex="isExperimented" width={100} cell={renderIsexperiment} />
        <Table.Column title={i18n.t('Version').toString()} dataIndex="agentVersion" width={100} />
        <Table.Column title={i18n.t('Start Time').toString()} dataIndex="connectTime" width={180} cell={formatDate} />
        <Table.Column title={i18n.t('Probe Status').toString()} dataIndex="agentStatus" width={80} cell={renderStatus} />
        <Table.Column title={i18n.t('Operation').toString()} lock="right" align={'center'} width={200} cell={renderOption} />
      </Table>
      <Pagination
        className={styles.pagination}
        current={page}
        total={total}
        pageSize={pageSize}
        locale={locale().Pagination}
        onChange={current => setPage(current)}
      />
      {showManualDialog && (
        <ManualDialog
          pluginType={pluginType}
          isUninstall={isUninstall}
          isInstall={isInstall}
          configurationId={configurationId}
          onClose={() => setShowManualDialog(false)}
          ostype={ostype}
        />
      )}
    </div>
  );
};

export default HostTable;
