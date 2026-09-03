# 绪论与算法复杂度分析

## 时间复杂度

关于易错点：**两种场景极易混淆——**「外层折半、内层满 n」**是 O(n log n)；而**「外层满 n、内层折半」**外层每次内层都重新从 n 开始，是 O(n log n) 的另一种写法。真正要警惕的是把「内层也随外层的 i 缩」误判成嵌套——那种 1+2+…+n 的三角循环是 O(n²)，不是 O(n)。

最后一部分的举例：

```
for i in range(1, n+1):   # 外层 n 次
    j = i
    while j > 0:
        print(j)
        j = j - 1         # 线性递减（每次减1）
```

总次数为=1+2+3+...+*n*=*n*(*n*+1)/2，结论：O(n²)

## 进阶

### 1.分析下面代码的时间复杂度，并说明为什么它是 O(n log n) 而不是 O(n²)：外层 while i<n 每轮把 i*=2（折半/倍增），内层 for j in range(n)。

显然外层是 log n，内层是 n，互不影响，所以整体是O(n log n)。

### 2.用**主定理**分析 Strassen 矩阵乘法的递归式 T(n)=7T(n/2)+O(n²)，解释它为何能突破普通矩阵乘法的 O(n³)。

我们用主定理一步步拆解，你就知道 Strassen 的“突破”到底突破在哪里了。

#### 1. 主定理速算（直接套公式）
给定递推式：**\( T(n) = 7T(n/2) + O(n^2) \)**

- \( a = 7 \)（递归调用次数）
- \( b = 2 \)（子问题规模缩小的倍数）
- \( f(n) = O(n^2) \)（合并/加减法成本），所以 **\( d = 2 \)**。

计算关键值：
$$
\log_b a = \log_2 7 \approx 2.807
$$
比较 \( d \) 和 \( log_b a \)：
- 因为 \( 2 < 2.807 \)，即 **\( d < log_b a \)**。

根据主定理（**情形一**）：  
**\( T(n) = \Theta(n^{\log_b a}) = \Theta(n^{\log_2 7}) \approx O(n^{2.807}) \)**。

---

#### 2. 为什么它能突破 \( O(n^3) \)？（对比普通乘法）
**普通矩阵乘法（暴力分块）**的递归式是：  
**\( T(n) = 8T(n/2) + O(n^2) \)**  

- 这里 \( a=8 \)，所以 \( log_2 8 = 3 \)，得出 
  $$
  T(n)=\Theta(n^3)
  $$

**核心区别就在递归调用次数 \( a \) 上：**

| 算法     | 分块后需要的**子乘法次数**                      | 递归指数                    | 时间复杂度             |
| :------- | :---------------------------------------------- | :-------------------------- | :--------------------- |
| 普通乘法 | **8** 次（2x2 分块，每个元素都要乘）            | \( log_2 8 = 3 \)           | **\( O(n^3) \)**       |
| Strassen | **7** 次（通过数学技巧，用加减法换掉 1 次乘法） | \( log_2 7 \approx 2.807 \) | **\( O(n^{2.807}) \)** |

---

#### 3. 面试中最容易理解的“突破本质”
> **突破的核心不是优化了合并（合并依然是 \( O(n^2) \)），而是降低了递归树的分支数。**

- 矩阵乘法最终结果的每个元素涉及大量乘加运算。**乘法的计算量远大于加减法**。
- Strassen 的骚操作是：**用 14 次加减法（\( O(n^2) \) 级别）的代价，省掉了 1 次巨大的子矩阵乘法（\( O(n^{2.807}) \) 级别的递归成本）**。
- 在主定理的公式里，只要 \( a \) 减少 1（从 8 降到 7），导致指数从 3 降到 2.807，即使 \( f(n) \) 的常数变得很大（加法变多），只要指数差存在，高阶项 \( n^{2.807} \) 最终一定碾压 \( n^2 \)。

**一句话面试速答模板：**  
“Strassen 把递归树的分支因子从 8 降到 7，主定理算出指数 \( 2.807 < 3 \)，虽然加法合并成本增加了，但属于低阶项，所以突破了立方级下界。”

### 3.思考「用空间换时间」：为什么用哈希表把两数之和从 O(n²) 优化到 O(n) 要付出 O(n) 的空间？结合时间/空间复杂度说明取舍。*LeetCode 1. 两数之和。*

```python
class Solution(object):
    def twoSum(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        """
        # 哈希表：用空间换时间，存储 数值 -> 下标
        num_to_index = {}
        
        # enumerate 同时获取下标 i 和值 num
        for i, num in enumerate(nums):
            # 计算当前数需要的搭档
            complement = target - num
            
            # 如果搭档已经在之前的哈希表中，直接返回
            if complement in num_to_index:
                return [num_to_index[complement], i]
            
            # 没找到搭档，就把当前数和下标存进哈希表，供后续元素匹配
            num_to_index[num] = i
        
        # 题目保证有且仅有一个解，理论不会执行到这里
        return []
```

### 4.动手实现归并排序并比较它与冒泡排序在 n=10⁴ 时的耗时差距，体会 O(n log n) 与 O(n²) 的实际差异。*推荐：LeetCode 912. 排序数组。*

```python
class Solution(object):
    def sortArray(self, nums):
        """
        :type nums: List[int]
        :rtype: List[int]
        """
        if len(nums) <= 1:
            return nums
        mid = len(nums)//2
        left = self.sortArray(nums[:mid])
        right = self.sortArray(nums[mid:])
        i = j = 0
        res = []
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                res.append(left[i]); i += 1
            else:
                res.append(right[j]); j += 1
        return res + left[i:] + right[j:]
```

1
