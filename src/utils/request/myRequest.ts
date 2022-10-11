import {axios} from '@alicloud/widget-request';

const instance = axios.create({
  baseURL: 'http://192.168.234.134:9090/',
  timeout: 3000
})

instance.interceptors.response.use((res) => {
  return res.data
}, (err) => {
  return Promise.reject(err)
})
export default instance