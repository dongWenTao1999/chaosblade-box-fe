import React from 'react';
import Translation from '../../../../../../components/Translation';
import i18n from '../../../../../../i18n';
import styles from './index.css';

import _ from 'lodash';
import moment from 'moment';
import { Checkbox, TimePicker } from '@alicloud/console-components';
import { ILabel } from 'config/interfaces/Chaos/components';

const { Group: CheckboxGroup } = Checkbox;

const WEEK_VALUES = [
  { label: i18n.t('Monday'), value: 'MON' },
  { label: i18n.t('Tuesday'), value: 'TUE' },
  { label: i18n.t('Wednesdays'), value: 'WED' },
  { label: i18n.t('Thursday'), value: 'THU' },
  { label: i18n.t('Friday'), value: 'FRI' },
  { label: i18n.t('Saturdays'), value: 'SAT' },
  { label: i18n.t('Sundays'), value: 'SUN' },
];

interface WeeksProps{
  value: any[];
  onChange: (value: any[]) => void;
}

function Weeks(props: WeeksProps) {

  function getStartTime(value: any[]) {
    const time = moment();

    if (!_.isEmpty(value) && _.size(value) > 2) {
      const second = value[ 0 ];
      const minute = value[ 1 ];
      const hour = value[ 2 ];

      if (!second.includes('/')) {
        time.second(parseInt(second));
      }
      if (!minute.includes('/')) {
        time.minute(parseInt(minute));
      }
      if (!hour.includes('/')) {
        time.hour(parseInt(hour));
      }

      return time;
    }

    time.second(0);
    time.minute(0);
    time.hour(0);
    return time;
  }

  function getValue(value: any[]) {
    if (!_.isEmpty(value)) {
      const week = value[ 5 ];
      if (week === '*') {
        return _.map(WEEK_VALUES, 'value');
      }
      return _.split(week, ',');

    }
    return [];
  }

  function handleWeekChange(values: string[]) {
    const { value, onChange } = props;

    if (!_.isEmpty(values)) {
      value[ 5 ] = _.join(values, ',');
    } else {
      value[ 5 ] = '?';
    }

    onChange && onChange(value);
  }

  function handleStartTimeChange(time: any) {
    const { value, onChange } = props;

    value[ 0 ] = time.second() + '';
    value[ 1 ] = time.minute() + '';
    value[ 2 ] = time.hour() + '';

    onChange && onChange(value);
  }

  const { value } = props;
  return (
    <div className={styles.container}>
      <div>
        <CheckboxGroup value={getValue(value)} onChange={(value: string[]) => handleWeekChange(value)}>
          {
            _.map(WEEK_VALUES, (item: ILabel) => {
              const { label, value } = item;
              return (
                <Checkbox className={styles.week} key={`week-item-${value}`} id={value} value={value}>
                  {label}
                </Checkbox>
              );
            })
          }
        </CheckboxGroup>
      </div>
      <div className={styles.startTime}>
        <span className={styles.prefix}><Translation>Start time</Translation></span>
        <TimePicker
          value={getStartTime(value)}
          onChange={handleStartTimeChange}
        />
      </div>
    </div>
  );
}

export default Weeks;
