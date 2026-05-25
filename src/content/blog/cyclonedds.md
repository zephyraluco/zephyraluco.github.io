---
title: 'CycloneDDS 中间件'
description: '记录使用CycloneDDS的经验和性能分析'
publishDate: '2026-05-18T00:00:00Z'
tags:
  - dds
---

## 相关中间件分析

1. 数据传输框架与序列化格式调研与性能测试 https://blog.csdn.net/stallion5632/article/details/141296883
2. zenoh中间件 https://blog.csdn.net/stallion5632/article/details/141306631
3. zenoh ros2插件 https://github.com/eclipse-zenoh/zenoh-plugin-ros2dds
4. iceoryx2共享内存 https://github.com/eclipse-iceoryx/iceoryx2

## CycloneDDS + iceoryx2 集成

最新的cyclonedds已经支持了psmx_iox2插件(https://github.com/eclipse-cyclonedds/cyclonedds/pull/2264), 其集成方式可借鉴 (https://github.com/zephyraluco/cyclonedds-iox2)

## 通信结构
![数据流向图](/images/cyclonedds-struct.png)