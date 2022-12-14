import DrillTotalStatistics from './DrillTotalStatistics';
import React, { useEffect } from 'react';
import TaskInfoDistribute from './TaskInfoDistribute';
import i18n from '../../../i18n';
import styles from './index.css';
import { CHAOS_DEFAULT_BREADCRUMB_ITEM as chaosDefaultBreadCrumb } from 'config/constants/Chaos/chaos';
import { removeParams } from 'utils/libs/sre-utils';
import { useDispatch } from 'utils/libs/sre-utils-dva';

const WorkSpace = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch.pageHeader.setTitle(i18n.t('Space management').toString());
    dispatch.pageHeader.setBreadCrumbItems(chaosDefaultBreadCrumb.concat([ // 修改面包屑
      {
        key: 'expertise_admin',
        value: i18n.t('Space management').toString(),
        path: '/chaos/workspace/list',
      },
    ]));
  }, []);

  useEffect(() => {
    removeParams('workspaceId');
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <div className={styles.top}>
        <TaskInfoDistribute />
        <DrillTotalStatistics />
      </div>
    </div>
  );
};

export default WorkSpace;
