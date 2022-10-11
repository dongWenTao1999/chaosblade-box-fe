import {IResultItem} from 'config/interfaces/Chaos/experimentTask'

export function calculatePreCPU(allData: IResultItem[]): IResultItem[] {
  const valuesLength = allData?.[0]?.values?.length, allDataLength = allData.length
  const res: any[] = []
  if (valuesLength) {
    for (let i = 0; i + 3 < valuesLength; i++) {
      let increaseIdle = 0, preTotal = 0, nextTotal = 0
      for (let j = 0; j < allDataLength; j++) {
        if (allData[j].metric.mode === 'idle') {
          increaseIdle = parseFloat(allData[j].values?.[i + 2][1]) - parseFloat(allData[j].values?.[i][1])
        }
        preTotal += parseFloat(allData[j].values?.[i][1])
        nextTotal += parseFloat(allData[j].values?.[i + 2][1])
      }
      res.push([allData[i].values?.[i][0], (1 - increaseIdle / (nextTotal - preTotal)) * 100])
    }
  }

  return [{
    metric: '',
    values: res
  }]
}