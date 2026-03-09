---
title: 'Navigation2 框架'
description: 'ROS2中的通用导航框架'
order: 2
---

## 常见坐标系

| 坐标系        | 作用                                     | 是否漂移           | 是否跳变                               |
| ------------- | ---------------------------------------- | ------------------ | -------------------------------------- |
| **map**       | 世界的固定参考坐标系（全局坐标）         | 不漂移             | 可能瞬时跳变（由 SLAM 或定位算法修正） |
| **odom**      | 机器人短期稳定的参考坐标系（里程计坐标） | 会随时间缓慢漂移   | 不跳变（连续）                         |
| **base_link** | 机器人自身的坐标系（机体中心）           | 随机器人移动而变化 | 不漂移、不跳变                         |

### base_link

- 表示**机器人机体的中心坐标系**，通常位于机器人底盘几何中心。
- 所有传感器坐标系（如 base_laser, camera_link）都相对于 base_link。
- 始终跟着机器人移动。
- 是机器人自身坐标系的基准。

### odom

- **里程计坐标系**，表示机器人基于里程计推算的位置。
- 很稳定、连续，不会突然跳动。
- **不会突然跳变**（连续性强）
- 但会**随时间累积漂移**（编码器误差、摩擦、偏转等）

### map

- **全局坐标系**
- 机器人在世界中的“真实位置”的估计。
- 不随时间漂移
- 但可能**瞬间跳变**，由 SLAM / 定位实时更新位置（如 AMCL、cartographer）

## TF转换

### TF和TF_STATIC

| 名称            | 作用                                   | 特性                                                    |
| --------------- | -------------------------------------- | ------------------------------------------------------- |
| **`tf`**        | 发布**动态变换（dynamic transforms）** | 随时间变化、持续更新、按照一定频率发布（如 10Hz、30Hz） |
| **`tf_static`** | 发布**静态变换（static transforms）**  | 不随时间变化、一次性发布、TF 会自动重复广播，无需循环   |

1. tf_static发布：ros2 run tf2_ros static_transform_publisher
2. C++，Python使用StaticTransformBroadcaster对象发布

## URDF文件

### xacro宏

| 标签                   | 用途                |
| ---------------------- | ------------------- |
| `<xacro:property>`     | 定义变量            |
| `<xacro:macro>`        | 定义宏              |
| `<xacro:arg>`          | 定义参数            |
| `<xacro:if>`           | 条件判断            |
| `<xacro:unless>`       | 反向条件            |
| `<xacro:include>`      | 引用外部 Xacro 文件 |
| `<xacro:insert_block>` | 插入复杂 XML 块     |
|                        |                     |

### 示例

```xml
  <!-- Define robot constants -->
  <xacro:property name="base_width" value="0.31"/>
  <xacro:property name="base_length" value="0.42"/>
  <xacro:property name="base_height" value="0.18"/>
  <xacro:property name="wheel_radius" value="0.10"/>
  <xacro:property name="wheel_width" value="0.04"/>
  <xacro:property name="wheel_ygap" value="0.025"/>
  <xacro:property name="wheel_zoff" value="0.05"/>
  <xacro:property name="wheel_xoff" value="0.12"/>
  <xacro:property name="caster_xoff" value="0.14"/>

  <!-- Robot Base -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="${base_length} ${base_width} ${base_height}"/>
      </geometry>
      <material name="Cyan">
        <color rgba="0 1.0 1.0 1.0"/>
      </material>
    </visual>
  </link>
```

#### `<link>`元素

**link** 是 URDF 的核心概念之一，表示机器人的一个“刚体部件”。

#### `<visual>`元素

一般在`link`下，表示该 `link` 在仿真或可视化软件中如何显示  
visual 可包含的子元素:

| 子元素       | 含义                                   |
| ------------ | -------------------------------------- |
| `<origin>`   | 模型坐标与 link 坐标的位置关系（可选） |
| `<geometry>` | 几何形状（必须）                       |
| `<material>` | 材质颜色（可选）                       |
| `<name>`     | 名称（可选）                           |

`<geometry>` 子元素：

| 几何类型 | 示例                                         |
| -------- | -------------------------------------------- |
| box      | `<box size="x y z"/>`                        |
| cylinder | `<cylinder radius="" length=""/>`            |
| sphere   | `<sphere radius=""/>`                        |
| mesh     | `<mesh filename="model.stl" scale="1 1 1"/>` |

## Navigation2流程图

![Navigation2](/images/navigation2.png)

### 目标接收与行为树启动 (Goal Reception)

- 用户或上层应用程序（例如前文提到的 Python 导航客户端）通过 ROS 2 Action 接口发送一个 `MapsToPose` 目标。
- Nav2 的中央枢纽 `bt_navigator` (Behavior Tree Navigator) 节点接收到该目标。
- `bt_navigator` 加载并启动预先定义的 XML 行为树，开始以设定的频率（通常为 10Hz - 100Hz）周期性地 “Tick”（滴答/遍历）这棵树。

### 全局路径规划 (Global Planning)

- 行为树中的第一个主要动作节点通常是 `ComputePathToPose`。
- 它会通过 Action 接口调用 `planner_server`。
- **计算过程**：规划器（如 Smac Planner, NavFn）结合**全局代价地图 (Global Costmap)** 和当前机器人的位置，计算出一条从起点到终点的无碰撞全局路径（一连串的 Pose 点序列）。

### 局部轨迹控制 (Local Control)

- 拿到全局路径后，行为树会将这条路径作为参数，传递给 `FollowPath` 动作节点。
- 该节点调用 `controller_server`。
- **计算过程**：控制器（如 DWB, MPPI, TEB）结合**局部代价地图 (Local Costmap)**、机器人的当前实时速度（里程计提供）以及运动学约束，在全局路径的指引下，计算出最优的局部轨迹。
- **指令下发**：控制器最终输出瞬时的线速度和角速度指令 `cmd_vel`，直接下发给底盘驱动节点执行。

### 实时感知与代价地图更新 (Continuous Perception)

- 在上述规划和控制的整个过程中，`global_costmap` 和 `local_costmap` 都在后台持续运行。
- 它们通过订阅激光雷达 (LiDAR)、深度相机等传感器数据，实时将静态地图和动态障碍物转化为栅格代价值，确保规划器和控制器能够避开突然出现的障碍。

### 异常处理与恢复行为 (Recoveries)

- 如果机器狗或机器人在行进中遇到死胡同，或者传感器被遮挡导致控制器无法计算出安全速度，`FollowPath` 或 `ComputePathToPose` 会向行为树返回 `FAILURE`（失败）状态。
- 行为树的控制流会立即跳转到恢复分支，调用 `behavior_server` 执行特定的恢复动作，例如：
  - **ClearCostmap**：清除代价地图中的临时噪点。
  - **Spin**：原地旋转一圈以重新扫描周围环境。
  - **BackUp**：原路倒退一小段距离。
- 恢复完成后，行为树会重新尝试全局规划和局部控制。

### bt_navigator与其他server的关系

#### 通信机制：Action 模式

`bt_navigator` 与这些 Server 的关系并非简单的函数调用，而是基于 **ROS 2 Action** 的异步通信。

1. **发出指令**：`bt_navigator` 在运行行为树时，当执行到某个节点（如 `<ComputePathToPose>`），它会向 `planner_server` 发起一个 Action 请求。
2. **监控状态**：在 Server 执行任务期间，`bt_navigator` 会持续接收反馈（Feedback），例如“当前完成了 50%”。
3. **处理结果**：任务完成后，Server 返回成功或失败。`bt_navigator` 根据这个结果决定行为树接下来走哪一个分支。

#### 协作流程

当你在 Rviz 中点下 "Nav2 Goal" 时，幕后发生了以下连锁反应：

1. **bt_navigator** 接收目标点，开始运行主行为树。
2. **调用 Planner**：行为树运行到规划节点，命令 `planner_server`：“帮我算一条去终点的路”。
3. **调用 Controller**：拿到路径后，行为树运行到跟随节点，命令 `controller_server`：“按照这条路走，注意安全”。
4. **遇到障碍物（异常处理）**：
   - 如果 `controller_server` 发现路被堵死，返回 `FAILURE`。
   - **bt_navigator** 捕捉到失败，转向行为树的“恢复分支”。
   - **调用 Behavior Server**：行为树命令 `behavior_server` 执行“原地旋转 360 度”来清理激光雷达视野。
   - **重启流程**：旋转结束后，`bt_navigator` 再次命令 `planner_server` 重新规划路径。

## 行为树结构

> **注意**：以下为 Navigation2 默认的行为树（navigate_to_pose_w_replanning_and_recovery.xml）结构。该树定义了导航失败时的完整恢复策略，包含多层级的错误检测与恢复机制。

![navigate_to_pose_w_replanning_and_recovery](/images/navigate_to_pose_w_replanning_and_recovery.png)

### 1. 顶层调度

整个导航任务依然由最外层的 `RecoveryNode` 掌控，最多重试 6 次。它包含两个主要子节点：

1. `PipelineSequence`（主导航分支）
2. `Sequence`（错误感知的系统级恢复分支）  
   如果主导航分支返回 `FAILURE`，顶层节点会触发第二个节点进行自救。

### 2. 主导航分支

- **动态选择器 (ControllerSelector & PlannerSelector)**
  - **行为**：在导航开始或运行中，这两个节点会订阅指定的 ROS 话题（`topic_name="controller_selector"` 等）。
  - **作用**：它们允许在运行时动态切换要使用的局部控制器和全局规划器，并将选择结果写入黑板（如 `{selected_controller}`）。如果话题没有数据，则使用默认的 `FollowPath` 和 `GridBased`。
- **智能规划循环 (ComputePathToPose 及其恢复)**
  - 规划器现在会输出一个特定的错误码：`error_code_id="{compute_path_error_code}"`。
  - **智能打断**：如果规划失败，内部的 `RecoveryNode` 会执行其第二个子节点（一个 `Sequence`）。此时，`WouldAPlannerRecoveryHelp` 会检查具体的错误码。如果错误原因是“目标点完全在地图外”或“致命的硬件断开”，清理代价地图毫无意义，该节点会直接返回 `FAILURE`，从而**跳过** `ClearGlobalCostmap`。只有当错误码表明“可能是动态障碍物导致的规划失败”时，才会执行清理动作。
- **智能控制循环 (FollowPath 及其恢复)**
  - 同理，控制器也会输出 `error_code_id="{follow_path_error_code}"`。
  - 如果跟随失败，`WouldAControllerRecoveryHelp` 会先诊断错误码。如果是可恢复的错误（如局部被困），才会去调用 `ClearLocalCostmap`。

### 3. 恢复分支

- **前置诊断门控 (Fallback 节点)**
  - 这个 `Fallback` 节点会依次检查控制器的错误码和规划器的错误码。
  - **逻辑**：如果 `WouldAControllerRecoveryHelp` **或** `WouldAPlannerRecoveryHelp` 其中任何一个返回 `SUCCESS`（意味着系统认为接下来的大恢复动作是有希望解决这个错误的），这个 `Fallback` 就会成功，从而允许流程继续往下走，进入实际的恢复动作。
  - **短路机制**：如果两个判断节点都返回 `FAILURE`（表明当前的错误是无可挽回的致命错误，比如传感器全部掉线），这个 `Fallback` 会返回 `FAILURE`。导致外层的 `Sequence` 直接失败。**这意味着系统将完全跳过无意义的原地旋转和后退，直接向上级报告失败，极大地节省了系统时间并避免了危险动作。**
- **轮询恢复 (ReactiveFallback -> RoundRobin)**
  - 如果通过了上述的诊断门控，才会进入经典的恢复流程。
  - 依然是优先检查 `GoalUpdated`（防止新目标下发时被阻塞），然后进入 `RoundRobin` 依次尝试：深度清理所有代价地图 -> 原地旋转 -> 原地等待 -> 倒车后退。
  - 注意，现在的 `Spin` 和 `BackUp` 节点也加上了 `error_code_id`，这意味着如果机器人在后退或旋转时卡住，也能抛出具体的错误原因供后续分析。

##
