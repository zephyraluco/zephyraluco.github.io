---
title: 'CycloneDDS 中间件'
description: '记录使用CycloneDDS的经验和性能分析'
publishDate: '2026-05-26T00:00:00Z'
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

## 数据流向

![数据流向图](/images/cyclonedds-dataflow.png)

## xml配置

所有的配置都包裹在 `<CycloneDDS>` 和具体的 `<Domain>` 标签中

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any"> </Domain>
</CycloneDDS>
```

### 1. `<General>` - 通用与网络基础设施

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <General>
            <NetworkInterfaceAddress>eth0</NetworkInterfaceAddress>
            <AllowMulticast>default</AllowMulticast>
            <MaxMessageSize>65500</MaxMessageSize>
            <FragmentSize>1300</FragmentSize>
            <Transport>udp</Transport>
            <DontRoute>false</DontRoute>
            <ExternalAddress>203.0.113.5:7400</ExternalAddress>
            <EnableMulticastLoopback>true</EnableMulticastLoopback>
        </General>
    </Domain>
</CycloneDDS>
```

控制底层网络接口、传输层协议以及全局路由行为：

- **`<NetworkInterfaceAddress>`**：绑定的网卡 IP 地址或设备名（如 `eth0`, `192.168.1.100`, `auto`）
- **`<AllowMulticast>`**：组播开关。可选 `default` (自动探测), `true` (强制开启), `false` (完全禁用), `spdp` (仅用于发现机制)
- **`<MaxMessageSize>`**：网络传输的最大消息尺寸（单位：字节）
- **`<FragmentSize>`**：当消息大于 MTU 时，进行分片的尺寸（通常默认为 1300 左右）
- **`<Transport>`**：指定传输层协议，可选 `udp`, `udp6`, `tcp`, `tcp6`，或 `default`
- **`<DontRoute>`**：布尔值（`true`/`false`），设为 true 时禁用操作系统的路由表，只在直接相连的局域网内传输
- **`<ExternalAddress>`**：配置公网地址，形式为 `IP:Port`。用于穿越 NAT（网络地址转换）或 Docker 容器映射时向外宣告的自身地址
- **`<EnableMulticastLoopback>`**：布尔值，是否允许组播环回（让同一台机器上的其他进程收到组播）

### 2. `<Discovery>` - 节点与端点发现

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Discovery>
            <DomainId>0</DomainId>
            <ParticipantIndex>auto</ParticipantIndex>
            <MaxAutoParticipantIndex>119</MaxAutoParticipantIndex>
            <Peers>
                <Peer address="192.168.1.100"/>
                <Peer address="192.168.1.101:7400"/>
            </Peers>
            <SPDPInterval>30 s</SPDPInterval>
            <SEDPInterval>100 ms</SEDPInterval>
            <LeaseDuration>10 s</LeaseDuration>
            <AssumeMulticastCapable>true</AssumeMulticastCapable>
        </Discovery>
    </Domain>
</CycloneDDS>
```

控制 DDSI-RTPS 发现协议的时间参数和行为：

- **`<DomainId>`**：强制指定 Domain ID，如果代码中传入的 ID 为 default，则使用此处的配置
- **`<ParticipantIndex>`**：当前 DomainParticipant 在主机上的索引。可选 `auto`, `none` 或具体整数，决定了收发端口号的计算（符合 RTPS 规范）
- **`<MaxAutoParticipantIndex>`**：如果采用 auto，此项限制自动递增的最大索引值（默认 119）
- **`<Peers>`**：用于静态发现的对等节点列表，无组播环境必备
  - **`<Peer address="IP:PORT"/>`**：具体的单播目标 IP 和端口
- **`<SPDPInterval>`**：向网络中广播“我在这里”消息（Participant 发现）的时间间隔（如 `30 s`, `100 ms`）
- **`<SEDPInterval>`**：广播具体 Publisher/Subscriber 等端点信息的时间间隔
- **`<LeaseDuration>`**：参与者存活租期，超过此时长未收到对方的心跳包即认为对方掉线（默认通常为 `10 s`）
- **`<AssumeMulticastCapable>`**：向未知的远端端点发送时，是否默认它们支持组播

### 3. `<Security>` - DDS Security 安全机制

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Security>
            <Enable>true</Enable>
            <Authentication>
                <IdentityCertificate>file:certs/identity_cert.pem</IdentityCertificate>
                <IdentityCA>file:certs/identity_ca.pem</IdentityCA>
                <PrivateKey>file:certs/private_key.pem</PrivateKey>
                <Password>my_secret_password</Password> </Authentication>
            <AccessControl>
                <PermissionsCA>file:certs/permissions_ca.pem</PermissionsCA>
                <Governance>file:certs/governance.p7s</Governance>
                <Permissions>file:certs/permissions.p7s</Permissions>
            </AccessControl>
            <Cryptographic/>
            <AllowUnauthenticatedParticipants>false</AllowUnauthenticatedParticipants>
        </Security>
    </Domain>
</CycloneDDS>
```

控制消息的认证、授权与加密（需挂载证书和密钥）：

- **`<Enable>`**：布尔值，安全特性的总开关
- **`<Authentication>`**：身份认证模块
  - `<IdentityCertificate>`：节点的身份证书文件路径（PEM格式）
  - `<IdentityCA>`：签发身份证书的 CA 根证书路径
  - `<PrivateKey>`：节点的私钥文件路径
  - `<Password>`：如果私钥有加密，配置在此
- **`<AccessControl>`**：访问控制模块（Topic 级别的读写权限）
  - `<PermissionsCA>`：签发权限文档的 CA 证书
  - `<Governance>`：DDS 域的治理策略签名文件（Signed XML / `.p7s`）
  - `<Permissions>`：当前节点的具体权限签名文件
- **`<Cryptographic>`**：加密插件配置，定义加密算法套件
- **`<AllowUnauthenticatedParticipants>`**：布尔值，设为 true 时，允许网络中存在没有证书的裸奔节点

### 4. `<Tracing>` - 日志、追踪与诊断

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Tracing>
            <Verbosity>info</Verbosity>
            <OutputFile>cyclonedds_trace.log</OutputFile>
            <AppendToFile>true</AppendToFile>
            <PacketCaptureFile>cyclonedds_traffic.pcap</PacketCaptureFile>
            <EnableCategory>discovery,traffic,timing</EnableCategory>
            <DisableCategory>whc,routing</DisableCategory>
        </Tracing>
    </Domain>
</CycloneDDS>
```

用于在终端输出运行状态或生成 pcap 文件排错：

- **`<Verbosity>`**：全局日志级别。从低到高可选：`none`, `severe`, `warning`, `info`, `config`, `fine`, `finest`, `trace`
- **`<OutputFile>`**：将日志重定向到指定文件，如 `cyclonedds.log`（若使用 `stdout` 或 `stderr` 则是输出到控制台）
- **`<AppendToFile>`**：布尔值，是否以追加模式写入日志
- **`<PacketCaptureFile>`**：将 CycloneDDS 收发的所有底层网络流量保存为 Wireshark 可读的 `.pcap` 文件
- **`<EnableCategory>`**：精细化追踪特定的内部行为类别（可以配置多个，逗号分隔）。可选值包括：`fatal`, `trace`, `discovery`, `traffic`, `timing`, `tcp`, `routing`, `sec_err`, `whc`, 等
- **`<DisableCategory>`**：关闭某些特定类别的日志追踪

### 5. `<Internal>` - 内核与队列水线调优

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Internal>
            <Watermarks>
                <WhcHigh>500kB</WhcHigh>
                <WhcLow>100kB</WhcLow>
            </Watermarks>
            <SocketSendBufferSize>10MB</SocketSendBufferSize>
            <SocketReceiveBufferSize>10MB</SocketReceiveBufferSize>
            <DeliveryQueueMaxSamples>1000</DeliveryQueueMaxSamples>
            <DeliveryQueueMaxSize>10MB</DeliveryQueueMaxSize>
            <SquashParticipants>true</SquashParticipants>
            <LivelinessMonitoring>true</LivelinessMonitoring>
        </Internal>
    </Domain>
</CycloneDDS>
```

专门针对极限吞吐量和低延迟场景的高级内核参数：

- **`<Watermarks>`**：控制发送写历史缓存（WHC）的水位线（防拥塞）
  - `<WhcHigh>`：高水位线，缓存达到此时发送线程阻塞
  - `<WhcLow>`：低水位线，缓存消化到此时解除阻塞
- **`<SocketSendBufferSize>`**：强制设置操作系统的 Socket 发送缓冲区大小（字节）
- **`<SocketReceiveBufferSize>`**：强制设置操作系统的 Socket 接收缓冲区大小
- **`<DeliveryQueueMaxSamples>`**：每个读者(Reader)的数据投递队列最大样本数
- **`<DeliveryQueueMaxSize>`**：投递队列的最大内存占用
- **`<SquashParticipants>`**：布尔值，设为 true 可将进程内创建的多个 DDS `DomainParticipant` 映射为底层的单个网络实体（节省端口和资源）
- **`<LivelinessMonitoring>`**：布尔值，启用内部存活性监控守护线程

### 6. `<SharedMemory>` - 零拷贝共享内存

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <SharedMemory>
            <Enable>true</Enable>
            <LogLevel>info</LogLevel>
        </SharedMemory>
    </Domain>
</CycloneDDS>
```

基于 Eclipse iceoryx 的 IPC 通信机制：

- **`<Enable>`**：布尔值，是否启用冰羚（iceoryx）共享内存（需要在编译 CycloneDDS 时开启 `ENABLE_SHM` 选项）
- **`<LogLevel>`**：iceoryx 子系统的日志级别（`off`, `fatal`, `error`, `warn`, `info`, `debug`, `verbose`）

### 7. `<TCP>` / `<TCP6>` - 可靠流式传输层

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <TCP>
            <Enable>true</Enable>
            <Port>7400</Port>
            <NoDelay>true</NoDelay>
            <TLS>
                <Keystore>keystore.p12</Keystore>
                <KeyPassphrase>password</KeyPassphrase>
                <VerifyMode>peer</VerifyMode>
                <Ciphersuites>TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256</Ciphersuites>
            </TLS>
        </TCP>
    </Domain>
</CycloneDDS>
```

当不使用默认的 UDP 而是强制走 TCP 时的专属配置：

- **`<Enable>`**：布尔值
- **`<Port>`**：TCP 监听和连接端口
- **`<NoDelay>`**：布尔值。如果为 true，开启 `TCP_NODELAY` 以关闭 Nagle 算法（减少攒包），牺牲部分带宽换取极低延迟
- **`<TLS>`**：配置 TLS（SSL）安全层
  - `<Keystore>`：TLS 证书库文件
  - `<KeyPassphrase>`：证书库密码
  - `<VerifyMode>`：对端验证模式（如 `none`, `peer`, `fail_if_no_peer_cert`）
  - `<Ciphers>` / `<Ciphersuites>`：强制限制 TLS 支持的加密算法套件

### 8. `<Threads>` - 线程调度与实时性 (RTOS/Linux RT)

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Threads>
            <Receive>
                <Scheduling>fifo</Scheduling>
                <Priority>90</Priority>
                <StackSize>1MB</StackSize>
            </Receive>
            <GC>
                <Scheduling>default</Scheduling>
                <Priority>0</Priority>
            </GC>
        </Threads>
    </Domain>
</CycloneDDS>
```

由于 CycloneDDS 会在后台开启诸多工作线程，此处可分别为它们指派系统级调度策略（需 OS 权限）： 涵盖的线程类别有：`<Receive>`, `<GC>` (垃圾回收), `<Discovery>`, `<Security>`, `<Sockets>` 等。 每个子类都可以单独配置以下参数：

- **`<Scheduling>`**：线程调度策略。可选 `default`, `fifo` (先进先出实时调度), `rr` (时间片轮转)
- **`<Priority>`**：线程优先级（整数）。如果是 Linux `fifo` 调度，对应 RT 优先级（1~99）；普通系统对应 Nice 值（-20~19）
- **`<StackSize>`**：强制设定该线程栈空间的字节大小

### 9. `<Compatibility>` - 互操作与兼容性策略

```xml
<CycloneDDS xmlns="https://cdds.io/config">
    <Domain id="any">
        <Compatibility>
            <StandardsConformance>lax</StandardsConformance>
            <AllowInvalidTryConstruct>true</AllowInvalidTryConstruct>
            <AckNackNumbitsEmpty>true</AckNackNumbitsEmpty>
            <ExplicitlyPublishQosSetToDefault>true</ExplicitlyPublishQosSetToDefault>
        </Compatibility>
    </Domain>
</CycloneDDS>
```

用于兼容其他厂商（如 RTI Connext, FastDDS）在实现规范时产生的差异：

- **`<StandardsConformance>`**：可选 `strict` (严格遵守 OMG 标准), `lax` (宽松), `pedantic`
- **`<AllowInvalidTryConstruct>`**：布尔值，允许反序列化失败的特定行为
- **`<AckNackNumbitsEmpty>`**：控制对空 AckNack 的行为理解（应对部分老版本 FastRTPS 的 Bug）
- **`<ExplicitlyPublishQosSetToDefault>`**：布尔值，主动将设为默认值的 QoS 也打包进发现数据中广播
