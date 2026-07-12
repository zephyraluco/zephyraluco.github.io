---
title: 'Coding Agent 配置记录'
description: '记录 Coding Agent 的使用配置'
publishDate: '2026-05-12T00:00:00Z'
---
## Cluade Code

### 常用命令

| 命令                | 功能                                    | 使用场景                           |
| ------------------- | --------------------------------------- | ---------------------------------- |
| `/context`          | 查看上下文各部分的详细 token 用量分析   | 排查哪部分消耗了过多 token         |
| `/compact [指令]`   | 压缩对话历史为摘要，可指定保留重点      | 上下文 60~70% 时主动压缩           |
| `/clear`            | 清除所有对话历史，保留 CLAUDE.md 和记忆 | 切换到新任务，或上下文已严重污染   |
| `/memory`           | 查看和编辑 CLAUDE.md 及自动记忆内容     | 检查记忆是否准确，删除过时条目     |
| `/btw`              | 快速提问，答案不进入对话历史            | 查阅小细节，不想污染上下文         |
| `/init`             | 分析项目并生成或改进 CLAUDE.md          | 首次在新项目使用，或项目有重大变更 |
| `#`（快捷键）       | 快速向 CLAUDE.md 添加一条持久指令       | 随时记录规范或约定                 |
| `claude --continue` | 继续最近一次会话                        | 重新打开终端后接着工作             |
| `claude --resume`   | 从历史列表中选择一次会话继续            | 恢复几天前的某个特定任务           |

### skill仓库

https://skillsmp.com/zh

### 切换环境变量

#### powershell

```powershell
function deepseek {
    $env:ANTHROPIC_MODEL = "deepseek-v4-pro"
    Write-Host "已切换到 deepseek-v4-pro"
}

function glm {
    $env:ANTHROPIC_MODEL = "glm-5.1"
    Write-Host "已切换到 GLM-5.1"
}

function minimax {
    $env:ANTHROPIC_MODEL = "Minimax-M2.7-highspeed"
    Write-Host "已切换到 Minimax-M2.7-highspeed"
}

function mimo {
    $env:ANTHROPIC_MODEL = "mimo-v2.5-pro"
    Write-Host "已切换到 mimo-v2.5-pro"
}

function claude {
    if ($env:ANTHROPIC_MODEL) {
        Write-Host "当前模型: $($env:ANTHROPIC_MODEL)"
    }
    else {
	$env:ANTHROPIC_MODEL = "glm-5.1"
    }

    & claude.exe @args
}
```

#### bash/zsh

```bash
deepseek() {
    export ANTHROPIC_MODEL="deepseek-v4-pro"
    echo "已切换到 deepseek-v4-pro"
}

glm() {
    export ANTHROPIC_MODEL="glm-5.1"
    echo "已切换到 GLM-5.1"
}

minimax() {
    export ANTHROPIC_MODEL="Minimax-M2.7-highspeed"
    echo "已切换到 Minimax-M2.7-highspeed"
}

mimo() {
    export ANTHROPIC_MODEL="mimo-v2.5-pro"
    echo "mimo-v2.5-pro"
}

claude() {
    if [ -n "$ANTHROPIC_MODEL" ]; then
        echo "当前模型: $ANTHROPIC_MODEL"
    else
        export ANTHROPIC_MODEL="glm-5.1"
    fi

    command claude "$@"
}
```

### Agent Teams

默认情况下下使用的是`Subagent`,如果需要使用Teams模式，则需要修改配置：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

或者设置环境变量：

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```
## VSCode Copilot

### 设置自定义模型(以 opencode 为例)
点击管理模型按钮：
![copilot配置](/images/vscode-copilot.png)
添加模型，选择Custom Endpoint：
![copilot配置](/images/vscode-copilot-1.png)
填入自定义组名(opencode)：
![copilot配置](/images/vscode-copilot-2.png)
填入API：
![copilot配置](/images/vscode-copilot-3.png)
填入对应的模型ID，名称，URL：
![copilot配置](/images/vscode-copilot-4.png)

### OpenCode 免费模型
![opencode模型](/images/opencode-model.png)