# 按照一下要求新建项目
1. 按照当前的目录结构，新建一个react项目，可以适当的增减目录/文件，保持合理的架构，高内聚低耦合。
2. lib目录下是一个库，主要实现一个HTML编辑器的功能。
    - lib/index.ts -> HTMLEditor: 实现一个html编辑器功能，核心功能是鼠标划过元素outline高亮。点击元素focus之后
        - 设置focus样式
        - 通过eventManager通知对业务层通知当前修改的元素dom实例以及坐标位置position信息。 e
        - HTMLEditor实例上关联了eventManager、styleManager等信息，业务层可以通过HTMLEditor实例去修改当前选中的dom元素的各类style属性。目前支持的元素有文本类、div区块类、图像类
    - lib/core/styleManager: 一个包含changeFont，changeMargin，changePadding、changebackground、changeColor等等修改dom元素style属性的一个style管理器
    - lib/core/eventManager: 主要实现editorManager各类交互的事件通知功能，例如hover、focus等，还有HTMLEditor初始化时对可编辑HTML dom容器的hover、focus等事件的绑定。 注意：除了普通dom元素，我们要支持对iframe内部元素的修改。
3. hooks目录内部写两个react hook
    - hooks/useDirectMode.ts: 主要实现对React ref引用元素或者iframe的innerContent内容进行编辑
    - hooks/useInjectMode.ts: 主要通过inject的方式对iframe内部元素进行编辑
4. components/tooltip.tsx ：主要实现一个工具栏弹层
5. src/index.tsx 是react项目入口
6. 在pages目录下编写测试代码
    - pages/react-dom.tsx: react ref引用dom编辑
    - pages/iframe.tsx: iframe内容编辑（通过iframeRef.current.contentWindow.document）引用


# 业务链路

1. 鼠标划过html元素高亮，点击focus显示高亮聚焦边框。
2. focus之后在所选元素的矩形下面弹出tootip
    - 对于文字元素，tooltip可以支持[字体大小]、[背景色]、[字体颜色]、[加粗]、[斜体]、[下划线]、[删除元素] 操作。
    - 对于div元素，tooltip可以支持[背景色]、[圆角]、[边框]、[边距]、[删除元素]操作。
    - 对于图片元素，tooltip可以支持操作待定。需要预留API设计

样式参考项目根目录的prd.jpg