---
lastUpdated: false
---

# UX 错误码

UX 命名空间覆盖可访问性、交互、响应式布局、内容、视觉反馈和体验检查器。

| Code                                        | 名称                                      | 严重程度  |
| ------------------------------------------- | ----------------------------------------- | --------- |
| [`UX-1001`](/reference/diagnostics/ux-1001) | 文本对比度不满足 WCAG                     | `warning` |
| [`UX-1002`](/reference/diagnostics/ux-1002) | 非文本内容缺少可访问替代                  | `warning` |
| [`UX-1003`](/reference/diagnostics/ux-1003) | 表单控件缺少可关联标签                    | `warning` |
| [`UX-1004`](/reference/diagnostics/ux-1004) | 交互控件缺少可访问名称                    | `warning` |
| [`UX-1005`](/reference/diagnostics/ux-1005) | 标题层级跳跃或页面缺少结构标题            | `info`    |
| [`UX-1006`](/reference/diagnostics/ux-1006) | Landmark 或区域语义缺失                   | `info`    |
| [`UX-1007`](/reference/diagnostics/ux-1007) | ARIA 引用目标不存在                       | `warning` |
| [`UX-1008`](/reference/diagnostics/ux-1008) | ARIA role 与元素语义冲突                  | `warning` |
| [`UX-1009`](/reference/diagnostics/ux-1009) | 状态变化未向辅助技术公告                  | `warning` |
| [`UX-1010`](/reference/diagnostics/ux-1010) | 颜色是唯一的信息表达                      | `warning` |
| [`UX-1011`](/reference/diagnostics/ux-1011) | 焦点指示器不可见或对比不足                | `warning` |
| [`UX-1012`](/reference/diagnostics/ux-1012) | 媒体缺少字幕、说明或控制                  | `warning` |
| [`UX-1013`](/reference/diagnostics/ux-1013) | 语言或文本方向声明缺失                    | `info`    |
| [`UX-1014`](/reference/diagnostics/ux-1014) | 键盘陷阱风险                              | `error`   |
| [`UX-1015`](/reference/diagnostics/ux-1015) | 目标 WCAG 等级无法验证                    | `info`    |
| [`UX-1016`](/reference/diagnostics/ux-1016) | 页面标题缺失或不明确                      | `warning` |
| [`UX-1017`](/reference/diagnostics/ux-1017) | 缺少跳过重复内容的路径                    | `warning` |
| [`UX-1018`](/reference/diagnostics/ux-1018) | 内容在缩放或重排后不可用                  | `warning` |
| [`UX-1019`](/reference/diagnostics/ux-1019) | 文本间距调整后内容不可读                  | `info`    |
| [`UX-1020`](/reference/diagnostics/ux-1020) | 输入目的或自动完成语义缺失                | `info`    |
| [`UX-1021`](/reference/diagnostics/ux-1021) | 自定义控件缺少 name、role 或 value        | `warning` |
| [`UX-1022`](/reference/diagnostics/ux-1022) | 认证流程依赖认知测试且缺少替代            | `warning` |
| [`UX-1023`](/reference/diagnostics/ux-1023) | 焦点被固定层遮挡                          | `warning` |
| [`UX-1024`](/reference/diagnostics/ux-1024) | 页面方向被锁定且无必要理由                | `info`    |
| [`UX-2001`](/reference/diagnostics/ux-2001) | 关键交互无法通过键盘完成                  | `error`   |
| [`UX-2002`](/reference/diagnostics/ux-2002) | Tab 顺序与视觉或任务顺序不一致            | `warning` |
| [`UX-2003`](/reference/diagnostics/ux-2003) | 指针或触摸目标尺寸过小                    | `warning` |
| [`UX-2004`](/reference/diagnostics/ux-2004) | 交互状态缺失                              | `warning` |
| [`UX-2005`](/reference/diagnostics/ux-2005) | 禁用控件缺少原因或替代路径                | `info`    |
| [`UX-2006`](/reference/diagnostics/ux-2006) | 输入错误反馈不及时或不可定位              | `warning` |
| [`UX-2007`](/reference/diagnostics/ux-2007) | Loading 或异步状态不可感知                | `warning` |
| [`UX-2008`](/reference/diagnostics/ux-2008) | destructive action 缺少确认或撤销路径     | `warning` |
| [`UX-2009`](/reference/diagnostics/ux-2009) | 手势交互缺少等价控件                      | `warning` |
| [`UX-2010`](/reference/diagnostics/ux-2010) | 弹层焦点管理不完整                        | `warning` |
| [`UX-2011`](/reference/diagnostics/ux-2011) | 交互反馈只依赖 hover                      | `warning` |
| [`UX-2012`](/reference/diagnostics/ux-2012) | 操作结果缺少就地反馈                      | `info`    |
| [`UX-2013`](/reference/diagnostics/ux-2013) | 快捷键与保留快捷键冲突                    | `warning` |
| [`UX-2014`](/reference/diagnostics/ux-2014) | 定时消失内容缺少暂停或延长路径            | `warning` |
| [`UX-2015`](/reference/diagnostics/ux-2015) | 取消、撤销或退出路径缺失                  | `warning` |
| [`UX-2016`](/reference/diagnostics/ux-2016) | 指针取消行为不安全                        | `warning` |
| [`UX-3001`](/reference/diagnostics/ux-3001) | 小屏视口出现不可访问横向溢出              | `warning` |
| [`UX-3002`](/reference/diagnostics/ux-3002) | 内容被固定层或弹层遮挡                    | `warning` |
| [`UX-3003`](/reference/diagnostics/ux-3003) | 文本在容器内截断且无恢复路径              | `warning` |
| [`UX-3004`](/reference/diagnostics/ux-3004) | 关键操作在目标断点不可见                  | `error`   |
| [`UX-3005`](/reference/diagnostics/ux-3005) | 阅读行宽或文本密度超出可读范围            | `info`    |
| [`UX-3006`](/reference/diagnostics/ux-3006) | 滚动容器嵌套导致操作困难                  | `warning` |
| [`UX-3007`](/reference/diagnostics/ux-3007) | Safe area 或视口单位处理不完整            | `warning` |
| [`UX-3008`](/reference/diagnostics/ux-3008) | 空状态或错误状态破坏布局                  | `warning` |
| [`UX-3009`](/reference/diagnostics/ux-3009) | 组件响应式约束缺失                        | `warning` |
| [`UX-3010`](/reference/diagnostics/ux-3010) | 弹层位置在视口边缘不可达                  | `warning` |
| [`UX-3011`](/reference/diagnostics/ux-3011) | 320px 宽度下内容不可重排                  | `warning` |
| [`UX-3012`](/reference/diagnostics/ux-3012) | 屏幕方向切换后布局或状态丢失              | `warning` |
| [`UX-3013`](/reference/diagnostics/ux-3013) | 软键盘遮挡输入或主要操作                  | `warning` |
| [`UX-3014`](/reference/diagnostics/ux-3014) | 打印或导出视图布局不可读                  | `info`    |
| [`UX-4001`](/reference/diagnostics/ux-4001) | 可见控件文案不明确                        | `info`    |
| [`UX-4002`](/reference/diagnostics/ux-4002) | 链接文本无法说明目标                      | `info`    |
| [`UX-4003`](/reference/diagnostics/ux-4003) | 错误消息缺少修复建议                      | `warning` |
| [`UX-4004`](/reference/diagnostics/ux-4004) | 空状态缺少下一步行动                      | `info`    |
| [`UX-4005`](/reference/diagnostics/ux-4005) | 必填、格式或约束说明缺失                  | `warning` |
| [`UX-4006`](/reference/diagnostics/ux-4006) | 状态标签缺少可理解含义                    | `info`    |
| [`UX-4007`](/reference/diagnostics/ux-4007) | 破坏性操作文案未说明影响范围              | `warning` |
| [`UX-4008`](/reference/diagnostics/ux-4008) | 本地化文本缺失或混用异常                  | `info`    |
| [`UX-4009`](/reference/diagnostics/ux-4009) | 数字、日期或单位缺少上下文                | `info`    |
| [`UX-4010`](/reference/diagnostics/ux-4010) | 状态反馈与实际结果不一致                  | `warning` |
| [`UX-4011`](/reference/diagnostics/ux-4011) | 术语或行话缺少解释                        | `info`    |
| [`UX-4012`](/reference/diagnostics/ux-4012) | 帮助入口不一致或缺失                      | `info`    |
| [`UX-4013`](/reference/diagnostics/ux-4013) | 多步骤流程缺少进度和当前位置              | `warning` |
| [`UX-4014`](/reference/diagnostics/ux-4014) | 重复输入或重复确认要求过多                | `info`    |
| [`UX-5001`](/reference/diagnostics/ux-5001) | 非文本图形对比度不足                      | `warning` |
| [`UX-5002`](/reference/diagnostics/ux-5002) | 视觉层级无法支撑主要任务                  | `info`    |
| [`UX-5003`](/reference/diagnostics/ux-5003) | 主题变量组合导致状态不可读                | `warning` |
| [`UX-5004`](/reference/diagnostics/ux-5004) | 动效缺少 reduced motion 降级              | `warning` |
| [`UX-5005`](/reference/diagnostics/ux-5005) | 闪烁或频闪风险                            | `error`   |
| [`UX-5006`](/reference/diagnostics/ux-5006) | Disabled、selected 或 active 状态区分不足 | `warning` |
| [`UX-5007`](/reference/diagnostics/ux-5007) | 可读字号或行高低于目标策略                | `info`    |
| [`UX-5008`](/reference/diagnostics/ux-5008) | 高密度界面缺少分组或分隔                  | `info`    |
| [`UX-5009`](/reference/diagnostics/ux-5009) | Skeleton 或占位内容与最终布局差异过大     | `info`    |
| [`UX-5010`](/reference/diagnostics/ux-5010) | 图表或数据可视化缺少可读编码              | `warning` |
| [`UX-5011`](/reference/diagnostics/ux-5011) | 图片文字缺少可访问替代                    | `warning` |
| [`UX-5012`](/reference/diagnostics/ux-5012) | 主题切换时出现短暂不可读闪烁              | `info`    |
| [`UX-9001`](/reference/diagnostics/ux-9001) | UX 检查器未知异常                         | `error`   |
| [`UX-9002`](/reference/diagnostics/ux-9002) | UX 规则配置非法                           | `error`   |
| [`UX-9003`](/reference/diagnostics/ux-9003) | UX 检测结果已过期                         | `info`    |
| [`UX-9004`](/reference/diagnostics/ux-9004) | UX 检查器证据不足                         | `info`    |
| [`UX-9005`](/reference/diagnostics/ux-9005) | UX 规则被显式豁免                         | `info`    |
| [`UX-9006`](/reference/diagnostics/ux-9006) | UX 诊断需要人工复核                       | `info`    |

[返回错误码索引](/reference/diagnostic-codes)
