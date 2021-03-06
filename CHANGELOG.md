# Change Log

All notable changes to the "vscode-statistic" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.6.2]

### Added

- 添加对部分后缀名的识别；

## [0.6.1]

### Change

- 单只有一个打开的文件夹时，执行命令将不再需要选择文件夹；
- 微调界面；

### Fixed

- 修正繁体文件缺失；

## [0.6.0]

### Change

- 采用异步的方式传递数据；

### Fixed

- 再大的项目，也不会出现无法读取的情况；

## [0.5.1-preview]

### Added

- 以当前区域格式显示数值以及表格的字符串排序；

## [0.5.0-preview]

### Added

- 统计空行和注释行的数量；

### Changed

- 改变表格头的鼠标样式；
- 更换排序列时，不再调整列宽度；

### Fixed

- 修正 windows 无法正确加载文件的错误；

## [0.4.0-preview]

### Added

- 表格内容现在可按列排序；

### Fixed

- 修正无法读取项目包含 .asar 文件时，无法读取的错误；
- 翻译内容不存在时，将原样返回 key，而不是 undefined；

### Changed

- 无法获取当前的区域信息时，不再弹出提示，而是通过 console.warn 输出一条警告；
- 加快页面的显示速度，数据改为异步加载；
- 取消操作时，不再提示错误；
- 颜色随主题变化而变化；

## [0.3.0-preview]

### Added

- 忽略二进制文件，即使该文件会被提交到 VCS 中；
- 单项目模式(workbenchState==folder)中，可以点击项目中的任意文件都显示操作菜单；
- 在没有统计数据时，显示专门的提示内容；

### Fixed

- 命令面板在多项目环境下会正确弹出选择框；

### Changed

- 多次打开同一项目的 webview，不再会多开页面；

## [0.2.0-preview]

### Added

- 添加对 VCS 的支持，目前支持 Git、Hg 和普通目录下的内容；

## [0.1.0-preview]

- Initial release
