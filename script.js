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
        
        // 缩放相关变量
        this.zoomFactor = 1.0;
        this.zoomStep = 0.1;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // 设置初始输入值
        document.getElementById('xMin').value = this.xMin;
        document.getElementById('xMax').value = this.xMax;
        document.getElementById('yMin').value = this.yMin;
        document.getElementById('yMax').value = this.yMax;
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 绘制初始图形
        this.drawGraph();
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
        
        // 使用说明按钮
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
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
            this.lastMouseX = e.offsetX;
            this.lastMouseY = e.offsetY;
        });
        
        // 画布鼠标滚轮缩放事件
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        });
        
        // 缩放按钮事件
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoomAtCenter(1 + this.zoomStep);
        });
        
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoomAtCenter(1 - this.zoomStep);
        });
        
        document.getElementById('resetZoomBtn').addEventListener('click', () => {
            this.resetZoom();
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
            this.hideModal('colorPickerModal');
        });
        
        // 使用说明模态框事件
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            this.hideModal('helpModal');
        });
        
        // 模态框关闭按钮事件
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal').id;
                this.hideModal(modalId);
            });
        });
        
        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
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
            enabled: true,
            error: null
        };
        
        this.functions.push(newFunction);
        this.renderFunctionItem(newFunction);
        
        // 验证表达式
        this.validateFunctionExpression(funcId);
        this.drawGraph();
        
        // 如果有空状态提示，移除它
        const emptyState = this.functionsContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        return funcId;
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
            <div class="function-input-container">
                <input type="text" class="function-expression" value="${func.expression}" placeholder="输入函数表达式..." data-func-id="${func.id}">
                <div class="error-message">${func.error || ''}</div>
            </div>
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
        
        // 添加防抖，避免频繁重绘
        expressionInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.updateFunctionExpression(func.id, e.target.value);
            }
        });
        
        expressionInput.addEventListener('blur', (e) => {
            this.updateFunctionExpression(func.id, e.target.value);
        });
        
        toggleBtn.addEventListener('click', () => {
            this.toggleFunction(func.id);
        });
        
        removeBtn.addEventListener('click', () => {
            this.removeFunction(func.id);
        });
    },
    
    // 验证函数表达式
    validateFunctionExpression: function(funcId) {
        const func = this.functions.find(f => f.id === funcId);
        if (!func) return false;
        
        // 清空之前的错误
        func.error = null;
        const expressionInput = document.querySelector(`#func-${funcId} .function-expression`);
        const errorElement = document.querySelector(`#func-${funcId} .error-message`);
        
        if (expressionInput) {
            expressionInput.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        // 如果表达式为空，不需要验证
        if (!func.expression.trim()) {
            return true;
        }
        
        try {
            // 测试表达式是否有效
            const testExpr = func.expression.replace(/x/g, '(0)');
            math.evaluate(testExpr);
            
            // 再测试一个随机值
            const randomX = Math.random() * 10 - 5;
            const randomExpr = func.expression.replace(/x/g, `(${randomX})`);
            math.evaluate(randomExpr);
            
            return true;
        } catch (error) {
            // 提取错误信息
            let errorMsg = '表达式错误';
            if (error.message) {
                // 从math.js错误消息中提取有用信息
                if (error.message.includes('undefined')) {
                    errorMsg = '使用了未定义的函数或变量';
                } else if (error.message.includes('parentheses')) {
                    errorMsg = '括号不匹配';
                } else {
                    errorMsg = error.message.substring(0, 50);
                }
            }
            
            func.error = errorMsg;
            
            if (expressionInput) {
                expressionInput.classList.add('error');
            }
            
            if (errorElement) {
                errorElement.textContent = errorMsg;
            }
            
            return false;
        }
    },
    
    // 更新函数表达式
    updateFunctionExpression: function(funcId, expression) {
        const func = this.functions.find(f => f.id === funcId);
        if (func) {
            func.expression = expression;
            
            // 验证表达式
            const isValid = this.validateFunctionExpression(funcId);
            
            // 只有当表达式有效或为空时才重绘
            if (isValid || !expression.trim()) {
                this.drawGraph();
            }
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
        this.zoomFactor = 1.0;
        
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
        
        this.showModal('colorPickerModal');
    },
    
    // 显示使用说明
    showHelp: function() {
        this.showModal('helpModal');
    },
    
    // 显示模态框
    showModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },
    
    // 隐藏模态框
    hideModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
        
        if (modalId === 'colorPickerModal') {
            this.colorPickerActiveFor = null;
        }
    },
    
    // 处理鼠标滚轮缩放
    handleZoom: function(e) {
        e.preventDefault();
        
        // 获取鼠标位置对应的数学坐标
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 转换为数学坐标
        const mathX = this.xMin + (mouseX / this.canvas.width) * (this.xMax - this.xMin);
        const mathY = this.yMax - (mouseY / this.canvas.height) * (this.yMax - this.yMin);
        
        // 计算缩放因子
        const delta = e.deltaY > 0 ? 1 - this.zoomStep : 1 + this.zoomStep;
        
        // 应用缩放
        this.xMin = mathX - (mathX - this.xMin) * delta;
        this.xMax = mathX + (this.xMax - mathX) * delta;
        this.yMin = mathY - (mathY - this.yMin) * delta;
        this.yMax = mathY + (this.yMax - mathY) * delta;
        
        // 更新显示值
        document.getElementById('xMin').value = this.xMin.toFixed(2);
        document.getElementById('xMax').value = this.xMax.toFixed(2);
        document.getElementById('yMin').value = this.yMin.toFixed(2);
        document.getElementById('yMax').value = this.yMax.toFixed(2);
        
        // 更新缩放因子
        this.zoomFactor *= delta;
        
        // 重绘图形
        this.drawGraph();
    },
    
    // 在中心点缩放
    zoomAtCenter: function(factor) {
        const centerX = (this.xMin + this.xMax) / 2;
        const centerY = (this.yMin + this.yMax) / 2;
        const rangeX = (this.xMax - this.xMin) / 2;
        const rangeY = (this.yMax - this.yMin) / 2;
        
        this.xMin = centerX - rangeX / factor;
        this.xMax = centerX + rangeX / factor;
        this.yMin = centerY - rangeY / factor;
        this.yMax = centerY + rangeY / factor;
        
        // 更新显示值
        document.getElementById('xMin').value = this.xMin.toFixed(2);
        document.getElementById('xMax').value = this.xMax.toFixed(2);
        document.getElementById('yMin').value = this.yMin.toFixed(2);
        document.getElementById('yMax').value = this.yMax.toFixed(2);
        
        // 更新缩放因子
        this.zoomFactor *= factor;
        
        // 重绘图形
        this.drawGraph();
    },
    
    // 重置缩放
    resetZoom: function() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.zoomFactor = 1.0;
        
        document.getElementById('xMin').value = this.xMin;
        document.getElementById('xMax').value = this.xMax;
        document.getElementById('yMin').value = this.yMin;
        document.getElementById('yMax').value = this.yMax;
        
        this.drawGraph();
    },
    
    // 绘制图形
    drawGraph: function() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制白色背景
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制坐标系
        this.drawCoordinateSystem();
        
        // 绘制每个函数
        this.functions.forEach(func => {
            if (func.enabled && func.expression.trim() !== '' && !func.error) {
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
            ctx.fillText(x.toFixed(this.getDecimalPlaces(xStep)), toCanvasX(x), toCanvasY(-0.3));
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
            ctx.fillText(y.toFixed(this.getDecimalPlaces(yStep)), toCanvasX(-0.3), toCanvasY(y) + 4);
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
        if (range < 2) step = 0.2;
        if (range < 1) step = 0.1;
        if (range < 0.2) step = 0.02;
        if (range < 0.1) step = 0.01;
        
        return step;
    },
    
    // 获取小数点后位数
    getDecimalPlaces: function(num) {
        if (num % 1 === 0) return 0;
        const match = num.toString().match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) return 0;
        return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
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
                if (isFinite(y)) {
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
        
        // 填充白色背景
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 缩放并绘制
        tempCtx.scale(scale, scale);
        
        // 重新绘制到临时画布
        this.drawToCanvas(tempCtx, tempCanvas.width / scale, tempCanvas.height / scale);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `函数绘图_${new Date().toISOString().slice(0, 10)}.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`, 1.0);
        link.click();
    },
    
    // 绘制到指定画布
    drawToCanvas: function(ctx, width, height) {
        // 保存原始画布尺寸
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        
        // 临时替换为指定画布
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = ctx;
        
        // 绘制图形
        this.drawGraph();
        
        // 恢复原始画布
        this.canvas.width = originalWidth;
        this.canvas.height = originalHeight;
        this.ctx = this.canvas.getContext('2d');
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
