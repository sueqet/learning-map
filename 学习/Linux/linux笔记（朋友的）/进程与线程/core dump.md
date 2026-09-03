# core dump

程序崩溃时将内存状态转储到文件，用于事后调试，相当于程序的"黑匣子"。

## 启用

```bash
ulimit -c unlimited         # 当前会话启用，不限制大小
ulimit -c 0                 # 禁用
```

永久启用，写入 `/etc/security/limits.conf`：
```
* soft core unlimited
* hard core unlimited
```

## 分析

```bash
gdb ./myprogram core        # 加载程序和 core 文件
bt                          # 查看崩溃时的调用栈（backtrace）
info locals                 # 查看局部变量
frame <N>                   # 切换到指定栈帧
```

可以看到崩溃时所在的代码行、完整调用栈、变量的值。
