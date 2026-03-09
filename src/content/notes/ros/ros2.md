---
title: 'ROS2 系统'
description: 'ROS2 系统组成'
order: 2
---

## ROS2 文件系统

### 资源索引 (Resource Index)

ROS 2 使用一套高效的机制来查找软件包和资源，而不是仅仅依赖于 `ROS_PACKAGE_PATH`（ROS 1 中的主要机制）。

- **`AMENT_PREFIX_PATH`**：
  - 这是一个由 `setup` 文件设置的环境变量。它包含一系列路径，指向已安装的 ROS 2 软件包（即 `install` 目录）。
  - ROS 2 工具和库会遍历这个路径列表来查找资源。
- **`share` 目录**：
  - 每个软件包在 `install` 目录下都有一个 `share/<package_name>` 目录，用于存放 `package.xml` 和其他非代码资源（如 launch 文件、配置文件）。
  - ROS 2 工具正是通过这个 `share` 目录来发现软件包及其内容的。

### 工作空间的层次结构

```
<workspace>/
├── src/      # 源代码目录，用于存放软件包
├── build/    # 构建目录，存放中间构建文件
├── install/  # 安装目录，存放已安装的文件
├── log/      # 日志目录，存放构建日志
```

### 软件包层次结构

```
<package_name>/
├── CMakeLists.txt       # 构建配置文件
├── package.xml          # 包的元信息（依赖、版本、描述等）
├── src/                 # 源代码目录
├── include/             # 头文件目录（C++）
├── launch/              # 启动文件目录（通常为 .launch.py 文件）
├── config/              # 配置文件目录
├── msg/ srv/ action/    # 消息、服务和动作定义文件目录
```

### 软件包中CMakeList的配置方式

#### 直接查找依赖

```cmake
# 设置版本
cmake_minimum_required(VERSION 3.5)
project(my_math_lib)

# 查找库
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)

# 构建目标
add_library()
target_include_directories()
ament_target_dependencies()
# 或者
add_executable()
target_include_directories()
ament_target_dependencies()

# 链接库
ament_target_dependencies()

# 导出库
ament_export_targets()
ament_export_dependencies()

# 安装库
install()
// 声明软件包
ament_package()
```

#### 使用package.xml的依赖

使用xml依赖时，会扫描depend标签中的依赖，而exec_depend则不会

```cmake
cmake_minimum_required (VERSION 3.5)
project(test)

// 查找package.xml中声明的依赖
find_package (ament_cmake_auto REQUIRED)
// 动态添加依赖
ament_auto_find_build_dependencies()

//构建目标，无需手动include和link
ament_auto_add_library ( my_lib SHARED
    src/example.cpp
    include/example.hpp)

ament_auto_package ()
```

### Node节点

`rclcpp::Node` 是 **ROS 2** 中的一个核心类，是分布式系统中的最小独立运行单元，负责与其他节点进行通信，例如发布/订阅消息、调用服务、启动定时器等。节点类型有两种：普通节点Node和生命周期节点LifecycleNode

#### Node的功能

`rclcpp::Node` 通过封装底层功能，提供了以下能力：

- 创建发布者和订阅者。`create_publisher`和`create_subscription`
- 创建服务（Server）和客户端（Client）。`create_service`和`create_client`
- 设置定时器和处理定时任务。`create_timer(单次)`和`create_wall_timer(循环)`
- 提供日志记录功能。`get_logger`
- 提供参数接口以动态管理节点参数。`declare_parameter`和`get_parameter`
- 支持 QoS（Quality of Service，服务质量）设置。

## QOS服务质量

### QoS 配置的主要参数

#### **Reliability（可靠性）**

- **`RELIABLE`（可靠传输）**：确保消息被成功传输，即使网络拥塞或丢包也会重试发送，适用于对数据完整性要求高的场景，如控制指令、关键状态信息等。
- **`BEST_EFFORT`（尽力而为）**：不保证消息一定被传输，适用于对丢包不敏感的场景，如传感器数据流（激光雷达、摄像头等）。

#### **Durability（持久性）**

- **`VOLATILE`（易失性）**：仅当订阅者存在时才会接收数据，订阅者断开后数据不会被存储。
- **`TRANSIENT_LOCAL`（瞬时本地）**：允许订阅者在连接后接收最近发布的数据（只在当前节点生命周期内存储）。

#### **History（历史记录）**

- 控制缓存消息的方式，确保订阅者能接收到所需的消息：
  - **`KEEP_LAST(N)`**：只保存最近的 N 条消息（默认 10）。
  - **`KEEP_ALL`**：保存所有消息，直到内存不足。

#### **Depth（缓存深度）**

- 当 `KEEP_LAST` 被选择时，此参数决定缓冲区大小，超出部分的旧消息将被丢弃。

#### **Liveliness（存活性）**

- 控制节点之间如何报告自身是否存活：
  - **`AUTOMATIC`（自动）**：默认模式，系统自动管理存活性检查。
  - **`MANUAL_BY_TOPIC`（手动管理）**：开发者需要手动触发存活性信号。

#### **Deadline（时限）**

- 设置消息发布间隔的约束时间，如果发布者未在规定时间内发布数据，则触发警告。

#### **Lifespan（生命周期）**

- 限定消息的有效时间，超过这个时间的消息将被丢弃。

## Executor执行器

### 执行器类型

| 执行器类型                                        | 说明                                       |
| ------------------------------------------------- | ------------------------------------------ |
| `rclcpp::executors::SingleThreadedExecutor`       | **单线程**执行器，适用于单节点单线程处理   |
| `rclcpp::executors::MultiThreadedExecutor`        | **多线程**执行器，适用于高吞吐量或并行任务 |
| `rclcpp::executors::StaticSingleThreadedExecutor` | **优化版单线程执行器**，适用于确定性调度   |

- `rclcpp::spin(Node::SharedPtr)` 是 **ROS 2 提供的一个简化 API**，它实际上是 `SingleThreadedExecutor` 的一个封装，等价于：

```cpp
	rclcpp::executors::SingleThreadedExecutor executor;
	executor.add_node(node);
	executor.spin();
```

- `rclcpp::spin_some(Node::SharedPtr)` 是 **ROS 2 提供的一个简化 API**，其功能是创建一个默认的单线程执行程序，并执行任何**立即可用**的工作(处理每个回调的 1 条消息)。
- `rclcpp::spin_all(Node::SharedPtr,chrono::nanoseconds)` 是 **ROS 2 提供的一个简化 API**，其功能是创建一个默认的单线程执行程序，并详尽执行**所有可用**的工作(在指定时间内尽力处理回调队列中的所有函数)，对应ros1中的`ros::spinOnce()`。
- `spin_node_once`,`spin_node_some`,`spin_node_all`是执行器的API，在上述简化API上**临时添加一个节点，运行完成后删除该节点**。

## launch.py 格式

### ROS2 `launch.py` 的基本格式

一个符合规范的 ROS2 启动文件通常满足以下要求：  
**1. 必须包含：`generate_launch_description()` 函数（唯一入口）**

- ROS2 Launch 系统会从此函数中获取 LaunchDescription 对象。
- 文件必须定义此函数，否则无法被 `ros2 launch` 调用。  
  **2. 函数必须返回：`LaunchDescription` 对象**
- 该对象包含所有需要启动的节点、动作、事件处理器、声明的参数等。

```python
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # 1. 声明 Launch 参数（可选）
    param = DeclareLaunchArgument(
        "param_name",
        default_value="default_value",
        description="description"
    )

    # 2. 配置节点
    node = Node(
        package="pkg_name",
        executable="node_exec",
        name="node_name",
        output="screen",
        parameters=[{"key": "value"}],
        remappings=[("a", "b")]
    )

    # 3. 返回 LaunchDescription
    return LaunchDescription([
        param,
        node,
    ])
```

### 常用模块

#### launch.Actions（动作）

| 模块                       | 说明                 |
| -------------------------- | -------------------- |
| `DeclareLaunchArgument`    | 声明命令行参数       |
| `IncludeLaunchDescription` | 引入其它 launch 文件 |
| `ExecuteProcess`           | 直接执行终端命令     |
| `RegisterEventHandler`     | 注册事件触发器       |
| `SetEnvironmentVariable`   | 设置环境变量         |

#### launch.Substitutions（变量替换）

| 模块                                                | 用途                 |
| --------------------------------------------------- | -------------------- |
| `LaunchConfiguration`                               | 获取命令行参数       |
| `Command`                                           | 执行命令（如 xacro） |
| `PathJoinSubstitution`                              | 拼接路径             |
| `FindPackageShare` 或 `get_package_share_directory` | 查找 ROS 包路径      |

#### launch_ros（节点相关模块）

| 模块                      | 说明               |
| ------------------------- | ------------------ |
| `Node`                    | 启动一个 ROS2 节点 |
| `ComposableNode`          | 组件节点           |
| `ComposableNodeContainer` | 节点容器           |

## 插件系统

基于 `pluginlib` 包，实现运行时动态加载/卸载共享库：

### 核心架构与工作流程

插件系统的工作依赖于四个核心组件：**基类**、**派生类**、**注册宏**和**XML 描述文件**。

#### 定义基类 (Base Class)

所有插件必须继承自一个公共基类。基类通常定义为抽象类（含纯虚函数）。

```cpp
// polygon_base.hpp
namespace polygon_interface {
  class RegularPolygon {
    public:
      virtual void initialize(double side_length) = 0;
      virtual double area() = 0;
      virtual ~RegularPolygon() {}
    protected:
      RegularPolygon(){}
  };
}
```

#### 实现派生类 (Plugin Class)

编写具体的实现，并使用 `pluginlib` 的宏将其注册为插件。

```cpp
// square_plugin.cpp
#include <polygon_interface/polygon_base.hpp>
#include <cmath>

namespace polygon_plugins {
  class Square : public polygon_interface::RegularPolygon {
    public:
      void initialize(double side_length) override { side_length_ = side_length; }
      double area() override { return side_length_ * side_length_; }
    private:
      double side_length_;
  };
}

// 关键步骤：注册插件
#include <pluginlib/class_list_macros.hpp>
// PLUGINLIB_EXPORT_CLASS(派生类, 基类)
PLUGINLIB_EXPORT_CLASS(polygon_plugins::Square, polygon_interface::RegularPolygon)
```

#### 配置 XML 文件

创建一个 XML 文件（如 `plugins.xml`），告诉 ROS 2 哪里可以找到这个插件。

```xml
<library path="square_plugin_lib">
  <class type="polygon_plugins::Square" base_class_type="polygon_interface::RegularPolygon">
    <description>这是一个计算正方形面积的插件。</description>
  </class>
</library>
```

#### 在 CMakeLists.txt 中导出

必须在 `CMakeLists.txt` 中声明该 XML 文件，以便 `ament` 索引系统能发现它。

```CMake
ament_export_libraries(square_plugin_lib)
pluginlib_export_plugin_description_file(polygon_interface plugins.xml)
```

### 动态加载插件

在主程序（Loader）中，我们使用 `ClassLoader` 来按需加载插件。

```cpp
#include <pluginlib/class_loader.hpp>
#include <polygon_interface/polygon_base.hpp>

int main(int argc, char** argv) {
  // 1. 创建加载器：参数为 (功能包名, 基类完全限定名)
  pluginlib::ClassLoader<polygon_interface::RegularPolygon> poly_loader("polygon_interface", "polygon_interface::RegularPolygon");

  try {
    // 2. 实例化插件：使用 XML 中定义的 type 名称
    std::shared_ptr<polygon_interface::RegularPolygon> square = poly_loader.createSharedInstance("polygon_plugins::Square");

    square->initialize(10.0);
    printf("Square area: %.2f\n", square->area());
  } catch (pluginlib::PluginlibException& ex) {
    printf("插件加载失败: %s\n", ex.what());
  }

  return 0;
}
```

## 组件系统

基于 ROS2 组件容器(rclcpp_components)，实现节点组合和复用：

### 组件定义

```cpp
#include <rclcpp/rclcpp.hpp>
#include <rclcpp_components/register_node_macro.hpp>

class MyComponent : public rclcpp::Node {
public:
    MyComponent(const rclcpp::NodeOptions& options) : Node("my_component", options) {}
};

RCLCPP_COMPONENTS_REGISTER_NODE(my_package::MyComponent)
```

### 运行组件

```bash
ros2 component run /opt/ros/humble/lib/rclcpp_components component_container /path/to/libmy_component.so
```

### launch 中使用

```python
from launch_ros.actions import ComposableNode, ComposableNodeContainer

container = ComposableNodeContainer(
    name='container',
    package='rclcpp_components',
    executable='component_container',
    composable_node_descriptions=[
        ComposableNode(
            package='my_package',
            node_plugin='my_package::MyComponent',
            node_name='my_component'
        )
    ]
)
```

### 插件系统 vs 组件系统

| 特性 | 插件系统           | 组件系统          |
| ---- | ------------------ | ----------------- |
| 用途 | 运行时加载任意实现 | 组合可复用节点    |
| 基础 | pluginlib          | rclcpp_components |
| 依赖 | 运行时发现插件     | 编译时注册        |
| 通信 | 自定义             | 标准ROS2话题/服务 |

## 进程间内存共享
