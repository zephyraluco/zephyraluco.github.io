---
title: 'Systemd 组件'
description: 'Systemd 组件使用指南'
order: 2
---

## 核心概念

**systemd** 是现代 Linux 发行版的初始化系统（init system），负责在系统启动后：

- 启动和管理系统服务
- 管理进程生命周期
- 处理依赖关系与并行启动
- 提供统一的日志系统（journald）
- 管理定时任务、设备、挂载点、会话等

### Unit（单元）

systemd 管理的所有对象统称为 **Unit**，由配置文件描述。  
常见 Unit 类型：

| 类型    | 后缀       | 用途                      |
| ------- | ---------- | ------------------------- |
| Service | `.service` | 后台服务                  |
| Target  | `.target`  | 启动目标（类似 runlevel） |
| Timer   | `.timer`   | 定时任务                  |
| Socket  | `.socket`  | 套接字激活                |
| Mount   | `.mount`   | 挂载点                    |
| Device  | `.device`  | 设备                      |

### Target（启动目标）

Target 用于描述系统状态，相当于 SysV 的 runlevel。  
常见 Target：

| Target              | 说明             |
| ------------------- | ---------------- |
| `multi-user.target` | 命令行多用户模式 |
| `graphical.target`  | 图形界面         |
| `rescue.target`     | 单用户救援模式   |
| `reboot.target`     | 重启             |
| `poweroff.target`   | 关机             |

查看默认启动目标：

```bash
systemctl get-default
```

设置默认启动目标：

```bash
systemctl set-default multi-user.target
```

## systemctl 常用命令

### 服务管理

```bash
systemctl start xxx.service
systemctl stop xxx.service
systemctl restart xxx.service
systemctl reload xxx.service
```

### 开机自启

```bash
systemctl enable xxx.service
systemctl disable xxx.service
```

### 状态与依赖

```bash
systemctl status xxx.service
systemctl is-active xxx.service
systemctl is-enabled xxx.service
systemctl list-dependencies xxx.service
```
