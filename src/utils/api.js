/**
 * API 请求相关工具函数
 * 支持缓存兜底（5分钟）+ 弱网容错
 */

import axios from 'axios'
import { processMonitorData, generateTimeRanges } from './monitor'

/** API 配置 */
const API_URL = import.meta.env.VITE_UPTIMEROBOT_API_URL
const API_KEY = import.meta.env.VITE_UPTIMEROBOT_API_KEY
const STATUS_SORT = import.meta.env.VITE_UPTIMEROBOT_STATUS_SORT

/** 缓存配置 */
const CACHE_KEY = 'uptime_cache'
const CACHE_TIME_KEY = 'uptime_cache_time'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

/**
 * 获取缓存数据
 */
const getCache = () => {
  try {
    const data = localStorage.getItem(CACHE_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('读取缓存失败:', e)
    return null
  }
}

/**
 * 写入缓存
 */
const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString())
  } catch (e) {
    console.warn('缓存写入失败:', e)
  }
}

/**
 * 判断缓存是否还在有效期
 */
const isCacheValid = () => {
  const time = localStorage.getItem(CACHE_TIME_KEY)
  return time && (Date.now() - Number(time) < CACHE_DURATION)
}

/**
 * 排序 + 数据处理
 */
const processAndSort = (monitors = []) => {
  let result = []

  if (STATUS_SORT === 'friendly_name') {
    result = monitors
      .sort((a, b) => b.friendly_name.localeCompare(a.friendly_name))
  } else if (STATUS_SORT === 'create_datetime') {
    result = monitors
      .sort((a, b) => b.create_datetime - a.create_datetime)
  } else {
    result = monitors
  }

  return result.map(processMonitorData)
}

/**
 * 请求 API（带缓存兜底）
 */
export const fetchMonitorData = async () => {
  try {
    const response = await axios.post(
      API_URL,
      {
        api_key: API_KEY,
        format: 'json',
        response_times: 1,
        logs: 1,
        custom_uptime_ranges: generateTimeRanges(),
        response_times_start_date: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
        response_times_end_date: Math.floor(Date.now() / 1000)
      },
      {
        timeout: 30000
      }
    )

    if (response.data?.stat !== 'ok') {
      throw new Error(response.data?.message || '未知错误')
    }

    const monitors = response.data.monitors || []
    const result = processAndSort(monitors)

    // ✅ 成功 → 更新缓存
    setCache(result)

    return result

  } catch (error) {
    console.warn('API 请求失败，尝试使用缓存:', error.message)

    const cache = getCache()

    if (cache) {
      console.warn('使用本地缓存数据')
      return cache
    }

    throw new Error('获取监控数据失败且无缓存可用: ' + error.message)
  }
}

/**
 * ✅ 推荐使用：缓存优先 + 后台刷新
 * 页面体验更好（秒开）
 */
export const fetchMonitorDataWithCacheFirst = async () => {
  const cache = getCache()

  if (cache) {
    // 👉 如果缓存过期，后台刷新
    if (!isCacheValid()) {
      fetchMonitorData().catch(() => {})
    }

    return cache
  }

  // 👉 没缓存才真正请求
  return await fetchMonitorData()
}