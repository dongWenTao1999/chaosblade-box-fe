import React from "react";
import "./index.css"
import {IResultItem} from 'config/interfaces/Chaos/experimentTask'
import ReactEcharts from 'echarts-for-react';
import {formatDate} from 'utils/libs/sre-utils'

interface IProps {
  data: IResultItem[];
  preData: IResultItem[];
  type: string;
}

function MyChart({data, type, preData}: IProps) {

  function getOption() {
    let option = {
      xAxis: {
        type: 'category',
        data: getxAxisData(data),
        axisLabel: {
          fontSize: '10'
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100
      },
      series: [
        {
          data: getSeriesData(data),
          type: 'line',
          itemStyle: {
            normal: {
              label: {show: true}
            }
          }
        }
      ]
    };
    return option
  }

  function getPreOption() {

    let option = {
      xAxis: {
        type: 'category',
        data: getxAxisData(preData)[0],
        axisLabel: {
          fontSize: '10'
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100
      },
      series: [
        {
          data: getSeriesData(preData)[0],
          itemStyle: {
            normal: {
              label: {show: true}
            }
          },
          type: 'line'
        }
      ]
    };
    return option
  }

  function getxAxisData(data) {
    return data.map((item) => {
      if (item.value) {
        return formatDate(item.value?.[0] * 1000, 'hh:mm:ss')
      } else {
        return item.values.map((value) => {
          return formatDate(value[0] * 1000, 'hh:mm:ss')
        })
      }
    })
  }

  function getSeriesData(data) {
    return data.map((item) => {
      if (item.value) {
        return parseFloat(item.value?.[1]).toFixed(2)
      } else {
        return [...item.values.map((value) => {
          return value[1].toFixed(2)
        })]
      }
    })
  }

  return (
    <div style={{display: 'flex', marginTop: '10px'}}>
      <div style={{flex: 1}}>
        <span style={{fontSize: '12px'}}>{`过去${type}`}</span>
        <ReactEcharts option={getPreOption()} style={{height: '400px', width: '600px',}}/>
      </div>
      <div style={{flex: 1}}>
        <span style={{fontSize: '12px'}}>{`实时${type}`}</span>
        <ReactEcharts option={getOption()} style={{height: '400px', width: '600px'}}/>
      </div>
    </div>
  )
}

export default MyChart
