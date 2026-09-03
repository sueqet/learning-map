# dnf

dnf（Dandified YUM）是 RHEL/CentOS/Rocky Linux 的高层包管理工具，yum 的继任者，自动处理依赖关系。

## 安装

```shell
dnf install <package>           # 安装
dnf install <package> -y        # 安装（自动确认）
dnf install ./local.rpm         # 安装本地 rpm 文件（同时解决依赖）
dnf reinstall <package>         # 重新安装
```

## 删除

```shell
dnf remove <package>            # 删除软件包
dnf autoremove                  # 删除不再需要的孤立依赖包
```

## 更新

```shell
dnf update                      # 更新所有包
dnf update <package>            # 更新指定包
dnf check-update                # 检查可用更新（不执行）
```

## 搜索与查询

```shell
dnf search <keyword>            # 按关键词搜索包名和描述
dnf info <package>              # 查看包详细信息
dnf list installed              # 列出所有已安装的包
dnf list available              # 列出软件源中所有可用的包
dnf provides <file>             # 查询哪个包提供了某个文件（如 dnf provides /usr/bin/git）
```

## 软件源管理

```shell
dnf repolist                    # 列出所有启用的软件源
dnf repolist all                # 列出所有软件源（含禁用的）
dnf makecache                   # 更新软件源缓存
dnf clean all                   # 清除所有缓存
```

## 历史记录

```shell
dnf history                     # 查看操作历史
dnf history undo <id>           # 撤销指定操作（回滚）
```
