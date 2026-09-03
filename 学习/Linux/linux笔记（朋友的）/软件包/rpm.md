# rpm

rpm（RPM Package Manager）是低层包管理工具，直接操作 `.rpm` 文件，**不自动处理依赖**。

## 安装

```shell
rpm -ivh <package.rpm>          # 安装（-i 安装，-v 显示详情，-h 显示进度）
rpm -Uvh <package.rpm>          # 升级（不存在则安装）
rpm -Fvh <package.rpm>          # 升级（不存在则跳过）
```

## 删除

```shell
rpm -e <package>                # 删除包（package 是包名，不是文件名）
rpm -e --nodeps <package>       # 强制删除，忽略依赖（慎用）
```

## 查询

```shell
rpm -qa                         # 列出所有已安装的包
rpm -qa | grep <keyword>        # 搜索已安装的包
rpm -qi <package>               # 查看包的详细信息
rpm -ql <package>               # 列出包安装的所有文件
rpm -qf <file>                  # 查询某个文件属于哪个包（如 rpm -qf /usr/bin/git）
rpm -qc <package>               # 列出包的配置文件
rpm -q --changelog <package>    # 查看包的变更记录
```

## 验证

```shell
rpm -V <package>                # 验证包文件是否被修改
rpm -K <package.rpm>            # 验证 rpm 文件的签名和完整性
```

## rpm vs dnf

| 场景 | 推荐工具 |
|------|---------|
| 从软件源安装 | `dnf`（自动处理依赖） |
| 安装本地 .rpm 文件 | `dnf install ./xxx.rpm`（也能处理依赖） |
| 查询已安装包信息 | `rpm -qi`、`rpm -ql` |
| 查询文件归属 | `rpm -qf` |
