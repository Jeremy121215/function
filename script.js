// 主应用程序对象
const GraphApp = {
    // 初始化函数
    init: function() {
        // 获取DOM元素
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.functionsContainer = document.getElementById('functionsContainer');
        this.coordinatesDisplay = document.getElementById('coordinates');
        
        // 初始化变量
        this.functions = [];
        this.nextFunctionId = 1;
        this.selectedColor = '#FF3B30';
        this.colorPickerActiveFor = null;
        
        // 坐标范围
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        
        // 设置初始输入值
        document.getElementById('xMin').value = this.xMin;
        document.getElementById('xMax').value = this.xMax;
        document.getElementById('yMin').value = this.yMin;
        document.getElementById('yMax').value = this.yMax;
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 绘制初始图形
        this.drawGraph();
        
        // 添加示例函数
        this.addExampleFunctions();
    },
    
    // 绑定事件监听器
    bindEvents: function() {
        // 添加函数按钮
        document.getElementById('addFunctionBtn').addEventListener('click', () => {
            this.addFunction();
        });
        
        // 清除所有按钮
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllFunctions();
        });
        
        // 重置视图按钮
        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.resetView();
        });
        
        // 导出图像按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportImage();
        });
        
        // 坐标范围输入变化
        document.getElementById('xMin').addEventListener('change', (e) => {
            this.xMin = parseFloat(e.target.value);
            this.drawGraph();
        });
        
        document.getElementById('xMax').addEventListener('change', (e) => {
            this.xMax = parseFloat(e.target.value);
            this.drawGraph();
        });
        
        document.getElementById('yMin').addEventListener('change', (e) => {
            this.yMin = parseFloat(e.target.value);
            this.drawGraph();
        });
        
        document.getElementById('yMax').addEventListener('change', (e) => {
            this.yMax = parseFloat(e.target.value);
            this.drawGraph();
        });
        
        // 画布鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateCoordinates(e);
        });
        
        // 颜色选择器相关事件
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectedColor = e.target.dataset.color;
                document.getElementById('customColorInput').value = this.selectedColor;
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        document.getElementById('customColorInput').addEventListener('change', (e) => {
            this.selectedColor = e.target.value;
        });
        
        document.getElementById('confirmColorBtn').addEventListener('click', () => {
            if (this.colorPickerActiveFor) {
                const funcId = this.colorPickerActiveFor;
                const func = this.functions.find(f => f.id === funcId);
                if (func) {
                    func.color = this.selectedColor;
                    this.updateFunctionColor(funcId, this.selectedColor);
                    this.drawGraph();
                }
            }
            this.hideColorPicker();
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideColorPicker();
        });
        
        // 点击模态框外部关闭
        document.getElementById('colorPickerModal').addEventListener('click', (e) => {
            if (e.target.id === 'colorPickerModal') {
                this.hideColorPicker();
            }
        });
    },
    
    // 添加函数
    addFunction: function(expression = '', color = null) {
        const funcId = this.nextFunctionId++;
        const funcColor = color || this.getRandomColor();
        
        const newFunction = {
            id: funcId,
            expression: expression,
            color: funcColor,
            enabled: true
        };
        
        this.functions.push(newFunction);
        this.renderFunctionItem(newFunction);
        this.drawGraph();
        
        // 如果有空状态提示，移除它
        const emptyState = this.functionsContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        return funcId;
    },
    
    // 添加示例函数
    addExampleFunctions: function() {
        const examples = [
            { expr: 'x^2', color: '#FF3B30' },
            { expr: 'sin(x)', color: '#4CD964' },
            { expr: '2*x + 3', color: '#007AFF' },
            { expr: 'sqrt(x)', color: '#5856D6' }
        ];
        
        examples.forEach(example => {
            this.addFunction(example.expr, example.color);
        });
    },
    
    // 渲染函数项
    renderFunctionItem: function(func) {
        const funcElement = document.createElement('div');
        funcElement.className = 'function-item';
        funcElement.id = `func-${func.id}`;
        funcElement.innerHTML = `
            <div class="function-header">
                <span class="function-label">f<sub>${func.id}</sub>(x) =</span>
                <div class="function-color" style="background-color: ${func.color};" data-func-id="${func.id}"></div>
            </div>
            <input type="text" class="function-expression" value="${func.expression}" placeholder="输入函数表达式..." data-func-id="${func.id}">
            <div class="function-actions">
                <button class="btn-toggle" data-func-id="${func.id}">
                    <i class="fas ${func.enabled ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    ${func.enabled ? '隐藏' : '显示'}
                </button>
                <button class="btn-remove" data-func-id="${func.id}">
                    <i class="fas fa-trash-alt"></i> 删除
                </button>
            </div>
        `;
        
        // 添加到容器
        this.functionsContainer.appendChild(funcElement);
        
        // 绑定事件
        const colorElement = funcElement.querySelector('.function-color');
        const expressionInput = funcElement.querySelector('.function-expression');
        const toggleBtn = funcElement.querySelector('.btn-toggle');
        const removeBtn = funcElement.querySelector('.btn-remove');
        
        colorElement.addEventListener('click', (e) => {
            this.showColorPicker(func.id, func.color);
        });
        
        expressionInput.addEventListener('input', (e) => {
            this.updateFunctionExpression(func.id, e.target.value);
        });
        
        toggleBtn.addEventListener('click', () => {
            this.toggleFunction(func.id);
        });
        
        removeBtn.addEventListener('click', () => {
            this.removeFunction(func.id);
        });
    },
    
    // 更新函数表达式
    updateFunctionExpression: function(funcId, expression) {
        const func = this.functions.find(f => f.id === funcId);
        if (func) {
            func.expression = expression;
            this.drawGraph();
        }
    },
    
    // 更新函数颜色
    updateFunctionColor: function(funcId, color) {
        const func = this.functions.find(f => f.id === funcId);
        if (func) {
            func.color = color;
            const colorElement = document.querySelector(`#func-${funcId} .function-color`);
            if (colorElement) {
                colorElement.style.backgroundColor = color;
            }
        }
    },
    
    // 切换函数显示状态
    toggleFunction: function(funcId) {
        const func = this.functions.find(f => f.id === funcId);
        if (func) {
            func.enabled = !func.enabled;
            
            const toggleBtn = document.querySelector(`#func-${funcId} .btn-toggle`);
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                toggleBtn.innerHTML = `<i class="fas ${func.enabled ? 'fa-eye' : 'fa-eye-slash'}"></i> ${func.enabled ? '隐藏' : '显示'}`;
            }
            
            this.drawGraph();
        }
    },
    
    // 删除函数
    removeFunction: function(funcId) {
        this.functions = this.functions.filter(f => f.id !== funcId);
        const funcElement = document.getElementById(`func-${funcId}`);
        if (funcElement) {
            funcElement.remove();
        }
        
        // 如果没有函数了，显示空状态
        if (this.functions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'function-item empty-state';
            emptyState.innerHTML = '<p>点击"添加函数"开始绘图</p>';
            this.functionsContainer.appendChild(emptyState);
        }
        
        this.drawGraph();
    },
    
    // 清除所有函数
    clearAllFunctions: function() {
        this.functions = [];
        this.nextFunctionId = 1;
        this.functionsContainer.innerHTML = '<div class="function-item empty-state"><p>点击"添加函数"开始绘图</p></div>';
        this.drawGraph();
    },
    
    // 重置视图
    resetView: function() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        
        document.getElementById('xMin').value = this.xMin;
        document.getElementById('xMax').value = this.xMax;
        document.getElementById('yMin').value = this.yMin;
        document.getElementById('yMax').value = this.yMax;
        
        this.drawGraph();
    },
    
    // 显示颜色选择器
    showColorPicker: function(funcId, currentColor) {
        this.colorPickerActiveFor = funcId;
        this.selectedColor = currentColor;
        
        document.getElementById('customColorInput').value = currentColor;
        
        // 激活匹配的颜色选项
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === currentColor) {
                option.classList.add('active');
            }
        });
        
        document.getElementById('colorPickerModal').classList.add('active');
    },
    
    // 隐藏颜色选择器
    hideColorPicker: function() {
        document.getElementById('colorPickerModal').classList.remove('active');
        this.colorPickerActiveFor = null;
    },
    
    // 绘制图形
    drawGraph: function() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制坐标系
        this.drawCoordinateSystem();
        
        // 绘制每个函数
        this.functions.forEach(func => {
            if (func.enabled && func.expression.trim() !== '') {
                this.plotFunction(func);
            }
        });
    },
    
    // 绘制坐标系
    drawCoordinateSystem: function() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 转换坐标
        const toCanvasX = (x) => (x - this.xMin) / (this.xMax - this.xMin) * width;
        const toCanvasY = (y) => height - (y - this.yMin) / (this.yMax - this.yMin) * height;
        
        // 绘制网格
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        // 垂直网格线
        const xStep = this.getGridStep(this.xMin, this.xMax);
        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
            if (Math.abs(x) < 0.001) continue; // 跳过原点，后面会画轴线
            
            ctx.beginPath();
            ctx.moveTo(toCanvasX(x), 0);
            ctx.lineTo(toCanvasX(x), height);
            ctx.stroke();
            
            // 绘制刻度标签
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(x.toFixed(1), toCanvasX(x), toCanvasY(-0.3));
        }
        
        // 水平网格线
        const yStep = this.getGridStep(this.yMin, this.yMax);
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            if (Math.abs(y) < 0.001) continue; // 跳过原点，后面会画轴线
            
            ctx.beginPath();
            ctx.moveTo(0, toCanvasY(y));
            ctx.lineTo(width, toCanvasY(y));
            ctx.stroke();
            
            // 绘制刻度标签
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(y.toFixed(1), toCanvasX(-0.3), toCanvasY(y) + 4);
        }
        
        // 绘制坐标轴
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        
        // X轴
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(0));
        ctx.lineTo(width, toCanvasY(0));
        ctx.stroke();
        
        // Y轴
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), 0);
        ctx.lineTo(toCanvasX(0), height);
        ctx.stroke();
        
        // 绘制箭头
        this.drawArrow(ctx, width - 10, toCanvasY(0), width, toCanvasY(0));
        this.drawArrow(ctx, toCanvasX(0), 10, toCanvasX(0), 0);
        
        // 绘制坐标轴标签
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('x', width - 5, toCanvasY(0) - 10);
        ctx.textAlign = 'left';
        ctx.fillText('y', toCanvasX(0) + 10, 15);
    },
    
    // 绘制箭头
    drawArrow: function(ctx, fromX, fromY, toX, toY) {
        const headlen = 10;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    },
    
    // 获取网格步长
    getGridStep: function(min, max) {
        const range = max - min;
        let step = 1;
        
        if (range > 20) step = 5;
        if (range > 50) step = 10;
        if (range > 100) step = 20;
        if (range > 200) step = 50;
        if (range > 500) step = 100;
        
        return step;
    },
    
    // 绘制函数
    plotFunction: function(func) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 转换坐标
        const toCanvasX = (x) => (x - this.xMin) / (this.xMax - this.xMin) * width;
        const toCanvasY = (y) => height - (y - this.yMin) / (this.yMax - this.yMin) * height;
        
        // 设置样式
        ctx.strokeStyle = func.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let isFirstPoint = true;
        let lastY = null;
        const step = (this.xMax - this.xMin) / width;
        
        for (let canvasX = 0; canvasX <= width; canvasX++) {
            const x = this.xMin + (canvasX / width) * (this.xMax - this.xMin);
            
            try {
                // 使用math.js解析表达式
                const expr = func.expression.replace(/x/g, `(${x})`);
                const y = math.evaluate(expr);
                
                // 检查y是否有效且在当前视图范围内
                if (isFinite(y) && y >= this.yMin && y <= this.yMax) {
                    const canvasY = toCanvasY(y);
                    
                    if (isFirstPoint) {
                        ctx.moveTo(canvasX, canvasY);
                        isFirstPoint = false;
                    } else {
                        // 检查是否有断点（函数不连续）
                        if (lastY !== null && Math.abs(y - lastY) > (this.yMax - this.yMin) / 2) {
                            ctx.moveTo(canvasX, canvasY);
                        } else {
                            ctx.lineTo(canvasX, canvasY);
                        }
                    }
                    lastY = y;
                } else {
                    isFirstPoint = true;
                    lastY = null;
                }
            } catch (error) {
                // 表达式求值出错，移动到下一个点
                isFirstPoint = true;
                lastY = null;
            }
        }
        
        ctx.stroke();
    },
    
    // 更新坐标显示
    updateCoordinates: function(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 转换到数学坐标
        const mathX = this.xMin + (x / this.canvas.width) * (this.xMax - this.xMin);
        const mathY = this.yMax - (y / this.canvas.height) * (this.yMax - this.yMin);
        
        this.coordinatesDisplay.textContent = `(${mathX.toFixed(2)}, ${mathY.toFixed(2)})`;
    },
    
    // 导出图像
    exportImage: function() {
        const format = document.getElementById('imageFormat').value;
        const scale = parseInt(document.getElementById('imageScale').value);
        
        // 创建临时画布用于导出
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width * scale;
        tempCanvas.height = this.canvas.height * scale;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 缩放并绘制
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `函数绘图_${new Date().toISOString().slice(0, 10)}.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`);
        link.click();
    },
    
    // 获取随机颜色
    getRandomColor: function() {
        const colors = [
            '#FF3B30', '#4CD964', '#007AFF', '#5856D6',
            '#FF9500', '#FF2D55', '#8E8E93', '#5AC8FA'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', () => {
    GraphApp.init();
});
