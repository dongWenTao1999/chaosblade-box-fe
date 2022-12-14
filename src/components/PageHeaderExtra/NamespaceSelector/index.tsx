import NamespaceManage from './NamespaceManage';
import React, { FC, useEffect, useState } from 'react';
import Translation from 'components/Translation';
import i18n from '../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';
import { Balloon, Icon, Select } from '@alicloud/console-components';
import { INsListData } from 'config/interfaces';
import { generateUrl, getActiveNamespace } from 'utils/libs/sre-utils';
import { getCookie, setCookie } from '@alicloud/cookie';
import { isEmpty } from 'lodash';
import { useDispatch } from 'utils/libs/sre-utils-dva';
import { useQuery } from 'utils/libs/sre-utils-hooks';

const { Option } = Select;
const win: any = window;

interface IPorps {
  selectSize?: 'small' | 'medium' | 'large' | undefined;
  isShowPrompt?: boolean;
}

const NamespaceSelector: FC<IPorps> = ({ selectSize = 'small', isShowPrompt = true }) => {
  const dispatch = useDispatch();
  const nsUrlData = useQuery('ns') || win.curNamespace || getCookie('curNamespace') || getActiveNamespace() || 'default';

  const [ dataNsList, setDataNsList ] = useState([]);
  const [ isDele, setIsDele ] = useState(0);
  const [ curNamespace, setCurNamespace ] = useState(nsUrlData);
  const [ curName, setCurName ] = useState(i18n.t('Default').toString());
  const [ namespace, setNamespace ] = useState(nsUrlData);
  const [ isNamespaceManageDialogShow, setIsNamespaceManageDialogShow ] = useState(false);

  // 请求环境列表
  const getNamespaceLs = async () => {
    const res = await dispatch.homeModel.getNamespaceList();
    const { Data: nsListData = [] } = res || {};
    if ((curNamespace && !isEmpty(nsListData) && !nsListData.every((item: INsListData) => item.namespace !== curNamespace)) || !curNamespace) {
      setCookie('curNamespace', 'default');
    }
    setDataNsList(nsListData);
  };

  useEffect(() => {
    getNamespaceLs();
  }, []);

  // 删除或新增环境
  function handleToggleNamespaceManageDialog(isDele: number, name: string) {
    if (name) {
      const { name: namespaceObjName } = dataNsList.filter((item: INsListData) => item.name === name)[0];
      setCurName(namespaceObjName);
      setNamespace(name);
    }

    setIsDele(isDele);
    handleToggleDialog();
  }

  // 更换环境
  async function handleSelectedNs(ns: string) {
    setCookie('curNamespace', ns);
    setCurNamespace(ns);
    // 切换空间，更新url参数，刷新页面
    window.location.href = generateUrl({ ns });
  }

  // 弹窗
  async function handleToggleDialog() {
    setIsNamespaceManageDialogShow(!isNamespaceManageDialogShow);
  }

  return (
    <>
      <Select
        className={styles.content}
        value={curNamespace}
        size={selectSize}
        onChange={handleSelectedNs}
        popupClassName={styles.optionItem}
        locale={locale().Select}
      >
        {
          dataNsList.length && dataNsList.map(({ name }, idx) => (
            <Option
              key={idx}
              value={name}
            >
              <div
                className={styles.item}
              >
                <Balloon align="l" trigger={name} closable={false}>{name}</Balloon>
                {name !== 'default' && name !== curNamespace ? (
                  <Icon
                    type={'close'}
                    size={'xs'}
                    className={styles.containerIcon}
                    onClick={e => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      handleToggleNamespaceManageDialog(1, name);
                    }}
                  />
                ) : (
                  ''
                )}
              </div>
            </Option>
          ))
        }
        <Option
          value={'label'}
          key={'label'}
        >
          <div
            className={styles.addNs}
            onClick={e => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              handleToggleNamespaceManageDialog(0, '');
            }}
          >
            <Translation>Add environment</Translation>
          </div>
        </Option>
      </Select>
      {curNamespace === 'default' && isShowPrompt &&
        <Balloon trigger={<Icon type="help" size="xs" style={{ color: '#888888', marginRight: '16px' }} />} closable={false}>
          <div style={{ lineHeight: '24px' }}>
            <Translation>The environment is generally used to set different usages, for example, the same application exists in the test environment, sandbox environment, and online environment. In different environments, the licenses for accessing applications are different</Translation>
          </div>
        </Balloon>
      }
      <>
        {isNamespaceManageDialogShow &&
          <NamespaceManage
            isdele={isDele}
            className={styles.dialogNamespace}
            visible={isNamespaceManageDialogShow}
            datanslist={dataNsList}
            delnamespace={namespace}
            delnamespacename={curName}
            onChange={getNamespaceLs}
            onClose={handleToggleDialog}
            onCancel={handleToggleDialog}
            onAddChange={handleSelectedNs}
          />
        }
      </>
    </>
  );
};

export default NamespaceSelector;
