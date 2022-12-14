import React, { FC, memo, useState } from 'react';
import SystemLicenseDialog from './LicenseDialog';
import Translation from 'components/Translation';
import i18n from '../../../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';
import { AGENT_OPTIONS, AGENT_SCOPE_TYPE } from 'config/constants';
import { Button, Search, Select } from '@alicloud/console-components';
import { getParams, pushUrl } from 'utils/libs/sre-utils';
import { useHistory } from 'dva';

import AutoInstallDialog from '../../../AutoInstall';

interface IProps {
  ecsNumber: number | '';
  onLinePluginNumber: number | '';
  agentType: number;
  searchKeyword: string;
  K8SHost?: boolean;
  tab?: number;
  handleAgentType: (agentType: number) => void;
  handleSearchKeyword: (keyword: string) => void;
}

const HeadHandler: FC<IProps> = props => {
  const {
    ecsNumber,
    onLinePluginNumber,
    agentType,
    searchKeyword,
    tab,
    K8SHost,
    handleAgentType,
    handleSearchKeyword,
  } = props;
  const isRegionPublic = getParams('region') === 'public';
  const history = useHistory();
  const [ dialogLicense, setDialogLicense ] = useState<boolean>(false);
  const [ isAutoInstall, setIsAutoInstall ] = useState<boolean>(false);

  // 查看License弹窗
  const handleLicenseDialog = () => {
    setDialogLicense(!dialogLicense);
  };

  return (
    <div className={styles.content}>
      <div className={styles.left}>
        {!K8SHost &&
          <Select
            placeholder={i18n.t('Default')}
            style={{ width: '160px' }}
            dataSource={AGENT_OPTIONS}
            value={agentType}
            filter={(key, item) => {
              return item.visible;
            }}
            onChange={handleAgentType}
            locale={locale().Select}
          />
        }
        <Search
          value={searchKeyword}
          style={{ minWidth: '300px' }}
          placeholder={(tab === AGENT_SCOPE_TYPE.K8S && !K8SHost) ? i18n.t('Support cluster ID, cluster name fuzzy matching') : i18n.t('Support IP, instance name, instance ID fuzzy matching')}
          onChange={handleSearchKeyword}
          hasClear
        />
        {!K8SHost &&
          <span className={styles.licenseTipsBtn} onClick={handleLicenseDialog}> <Translation>View License</Translation> </span>
        }
      </div>
      <div className={styles.right}>
        {agentType === 1 && !isRegionPublic && (
          <div className={styles.info}>
            <span><Translation>Number of online probes/total number of ECS</Translation>:</span>
            <span style={{ color: '#028f3f' }}> { onLinePluginNumber } </span>
            <span> / </span>
            <span style={{ color: '#2077b4' }}> { ecsNumber } </span>
          </div>
        )}
        <Button
          style={{ display: 'none' }}
          type={'primary'}
          onClick={() => pushUrl(history, '/manage/setting/step', { iis: '1' })}
        >
          <Translation>Install Architecture-Aware Probes</Translation>
        </Button>
        <Button
          style={{ display: 'none' }}
          type={'primary'}
          className={styles.btn}
          onClick={() => pushUrl(history, '/manage/setting/step')}
        >
          <Translation>Add traffic protectio</Translation>
        </Button>
        {!K8SHost &&
          <Button
            type={'primary'}
            onClick={() => setIsAutoInstall(true)}
          >
            <Translation>Automatically install probes</Translation>
          </Button>
        }
        &nbsp;&nbsp;
        {!K8SHost &&
          <Button
            type={'primary'}
            onClick={() => pushUrl(history, '/manage/setting/step', { iis: '1' })}
          >
            <Translation>Manually install probes</Translation>
          </Button>
        }
      </div>
      {dialogLicense && (
        <SystemLicenseDialog
          visible={dialogLicense}
          onClose={handleLicenseDialog}
        />
      )}
      {isAutoInstall && <AutoInstallDialog onClose={() => setIsAutoInstall(false)} />}
    </div>
  );
};

export default memo(HeadHandler);
