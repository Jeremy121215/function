// 高级函数绘图应用程序
const AdvancedGraphApp = {
    // 初始化
    init: function() {
        // 获取DOM元素
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coordinatesDisplay = document.getElementById('coordinates');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        
        // 初始化画布尺寸
        this.resizeCanvas();
        
        // 初始化变量
        this.functions = [];
        this.variables = {};
        this.nextFunctionId = 1;
        this.nextVariableId = 1;
        
        // 视图参数
        this.view = {
            centerX: 0,
            centerY: 0,
            scale: 50, // 每单位像素数
            minScale: 5,
            maxScale: 500
        };
        
        // 交互状态
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // 批量选择状态
        this.batchMode = false;
        this.selectedFunctions = new Set();
        
        // 自动补全数据
        this.autocompleteData = {
            functions: [
                'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
                'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
                'sqrt', 'cbrt', 'abs', 'exp', 'log', 'ln', 'log10',
                'ceil', 'floor', 'round', 'sign'
            ],
            constants: ['pi', 'e'],
            active: false,
            items: [],
            selectedIndex: -1
        };
        
        // 设置默认值
        this.settings = {
            language: 'zh-CN',
            errorLanguage: 'zh-CN',
            gridDensity: 'medium',
            showGrid: true,
            axisLabels: true,
            zoomSensitivity: 1.0,
            dragSensitivity: 1.0,
            theme: 'light',
            lineWidth: 2
        };
        
        // 错误消息（多语言）
        this.errorMessages = {
            'zh-CN': {
                'undefined': '未定义的函数或变量',
                'parentheses': '括号不匹配',
                'syntax': '语法错误',
                'division_by_zero': '除以零',
                'invalid_argument': '无效参数',
                'complex_number': '结果包含复数',
                'unknown': '未知错误'
            },
            'en': {
                'undefined': 'Undefined function or variable',
                'parentheses': 'Mismatched parentheses',
                'syntax': 'Syntax error',
                'division_by_zero': 'Division by zero',
                'invalid_argument': 'Invalid argument',
                'complex_number': 'Result contains complex numbers',
                'unknown': 'Unknown error'
            }
        };
        
        // 绑定事件
        this.bindEvents();
        
        // 加载保存的设置
        this.loadSettings();
        
        // 应用设置
        this.applySettings();
        
        // 绘制初始图形
        this.drawGraph();
        
        // 添加默认变量
        this.addVariable('a', 1, { type: 'constant' });
        this.addVariable('b', 2, { type: 'constant' });
        this.addVariable('c', 3, { type: 'slider', min: 0, max: 10, step: 0.1 });
        
        // 初始化Sortable
        this.initSortable();
        
        // 初始化选项卡
        this.initTabs();
    },
    
    // 调整画布尺寸
    resizeCanvas: function() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // 确保画布尺寸为整数
        this.canvas.width = Math.floor(this.canvas.width);
        this.canvas.height = Math.floor(this.canvas.height);
    },
    
    // 绑定事件
    bindEvents: function() {
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawGraph();
        });
        
        // 侧边栏切换
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // 添加函数按钮
        document.getElementById('addFunctionBtn').addEventListener('click', () => {
            this.addFunction();
        });
        
        // 批量删除按钮
        document.getElementById('batchDeleteBtn').addEventListener('click', () => {
            this.toggleBatchMode();
        });
        
        // 删除选中按钮
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
            this.deleteSelectedFunctions();
        });
        
        // 全选复选框
        document.getElementById('selectAllFunctions').addEventListener('change', (e) => {
            this.selectAllFunctions(e.target.checked);
        });
        
        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 保存设置按钮
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // 重置设置按钮
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });
        
        // 关闭模态框
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
        
        // 重置视图按钮
        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.resetView();
        });
        
        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportImage();
        });
        
        // 全屏按钮
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // 生成表格按钮
        document.getElementById('generateTableBtn').addEventListener('click', () => {
            this.generateTable();
        });
        
        // 设置滑块值显示
        document.getElementById('zoomSensitivity').addEventListener('input', (e) => {
            document.getElementById('zoomSensitivityValue').textContent = e.target.value;
        });
        
        document.getElementById('dragSensitivity').addEventListener('input', (e) => {
            document.getElementById('dragSensitivityValue').textContent = e.target.value;
        });
        
        document.getElementById('lineWidth').addEventListener('input', (e) => {
            document.getElementById('lineWidthValue').textContent = e.target.value;
        });
        
        // 画布鼠标事件
        this.canvas.addEventListener('mousedown', (e) => {
            this.startDrag(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            this.handleZoom(e);
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.endDrag();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.endDrag();
        });
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.startDrag(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.startPinch(e);
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                this.handleMouseMove(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.handlePinch(e);
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.endDrag();
        });
        
        // 键盘事件（用于自动补全）
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 点击文档其他地方关闭自动补全
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-dropdown') && 
                !e.target.closest('.function-expression')) {
                this.hideAutocomplete();
            }
        });
    },
    
    // 初始化选项卡
    initTabs: function() {
        document.querySelectorAll('.tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    },
    
    // 切换选项卡
    switchTab: function(tabId) {
        // 更新活动选项卡按钮
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        
        // 更新活动选项卡内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // 如果切换到函数选项卡，更新函数选择下拉菜单
        if (tabId === 'table') {
            this.updateFunctionSelect();
        }
    },
    
    // 初始化Sortable（拖放排序）
    initSortable: function() {
        const functionsList = document.getElementById('functionsList');
        Sortable.create(functionsList, {
            animation: 150,
            handle: '.function-label',
            onEnd: (evt) => {
                // 重新排序函数数组
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;
                const func = this.functions[oldIndex];
                
                this.functions.splice(oldIndex, 1);
                this.functions.splice(newIndex, 0, func);
                
                this.drawGraph();
            }
        });
    },
    
    // 坐标转换函数
    toCanvasX: function(x) {
        return this.canvas.width / 2 + (x - this.view.centerX) * this.view.scale;
    },
    
    toCanvasY: function(y) {
        return this.canvas.height / 2 - (y - this.view.centerY) * this.view.scale;
    },
    
    toMathX: function(canvasX) {
        return this.view.centerX + (canvasX - this.canvas.width / 2) / this.view.scale;
    },
    
    toMathY: function(canvasY) {
        return this.view.centerY - (canvasY - this.canvas.height / 2) / this.view.scale;
    },
    
    // 开始拖动
    startDrag: function(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX || e.pageX;
        this.lastMouseY = e.clientY || e.pageY;
        this.canvas.style.cursor = 'grabbing';
    },
    
    // 处理鼠标移动
    handleMouseMove: function(e) {
        const x = e.clientX || e.pageX;
        const y = e.clientY || e.pageY;
        
        // 更新坐标显示
        const mathX = this.toMathX(x - this.canvas.getBoundingClientRect().left);
        const mathY = this.toMathY(y - this.canvas.getBoundingClientRect().top);
        this.coordinatesDisplay.textContent = `(${mathX.toFixed(2)}, ${mathY.toFixed(2)})`;
        
        // 处理拖动
        if (this.isDragging) {
            const dx = (x - this.lastMouseX) * this.settings.dragSensitivity;
            const dy = (y - this.lastMouseY) * this.settings.dragSensitivity;
            
            this.view.centerX -= dx / this.view.scale;
            this.view.centerY += dy / this.view.scale;
            
            this.lastMouseX = x;
            this.lastMouseY = y;
            
            this.drawGraph();
        }
    },
    
    // 处理缩放
    handleZoom: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const mathX = this.toMathX(mouseX);
        const mathY = this.toMathY(mouseY);
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const scaleFactor = delta * this.settings.zoomSensitivity;
        
        const newScale = this.view.scale * scaleFactor;
        
        // 限制缩放范围
        if (newScale >= this.view.minScale && newScale <= this.view.maxScale) {
            this.view.scale = newScale;
            
            // 调整中心点以保持鼠标位置不变
            const newCenterX = mathX - (mouseX - this.canvas.width / 2) / this.view.scale;
            const newCenterY = mathY + (mouseY - this.canvas.height / 2) / this.view.scale;
            
            this.view.centerX = newCenterX;
            this.view.centerY = newCenterY;
            
            this.updateZoomDisplay();
            this.drawGraph();
        }
    },
    
    // 处理触摸捏合缩放
    startPinch: function(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.pinchStartDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        this.pinchStartScale = this.view.scale;
    },
    
    handlePinch: function(e) {
        if (e.touches.length !== 2) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        const scaleFactor = currentDistance / this.pinchStartDistance;
        const newScale = this.pinchStartScale * scaleFactor * this.settings.zoomSensitivity;
        
        // 限制缩放范围
        if (newScale >= this.view.minScale && newScale <= this.view.maxScale) {
            this.view.scale = newScale;
            
            // 计算中心点（两个触摸点的中点）
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            const rect = this.canvas.getBoundingClientRect();
            const mathX = this.toMathX(centerX - rect.left);
            const mathY = this.toMathY(centerY - rect.top);
            
            // 调整视图中心
            const newCenterX = mathX - (centerX - rect.left - this.canvas.width / 2) / this.view.scale;
            const newCenterY = mathY + (centerY - rect.top - this.canvas.height / 2) / this.view.scale;
            
            this.view.centerX = newCenterX;
            this.view.centerY = newCenterY;
            
            this.updateZoomDisplay();
            this.drawGraph();
        }
    },
    
    // 结束拖动
    endDrag: function() {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    },
    
    // 更新缩放显示
    updateZoomDisplay: function() {
        const baseScale = 50;
        const zoomLevel = (this.view.scale / baseScale).toFixed(2);
        this.zoomLevelDisplay.textContent = `${zoomLevel}x`;
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
            error: null,
            condition: null,
            katexRendered: null
        };
        
        this.functions.push(newFunction);
        this.renderFunctionItem(newFunction);
        
        // 验证表达式
        this.validateFunctionExpression(funcId);
        this.drawGraph();
        
        // 如果有空状态提示，移除它
        const emptyState = document.querySelector('#functionsList .empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        return funcId;
    },
    
    // 渲染函数项
    renderFunctionItem: function(func) {
        const funcElement = document.createElement('div');
        funcElement.className = `function-item ${this.batchMode ? 'batch-mode' : ''}`;
        funcElement.id = `func-${func.id}`;
        funcElement.innerHTML = `
            <div class="function-header">
                <div class="function-checkbox" style="display: ${this.batchMode ? 'flex' : 'none'}">
                    <input type="checkbox" id="func-checkbox-${func.id}" data-func-id="${func.id}">
                    <label for="func-checkbox-${func.id}" class="function-label">f<sub>${func.id}</sub>(x) =</label>
                </div>
                <div class="function-checkbox" style="display: ${this.batchMode ? 'none' : 'flex'}">
                    <span class="function-label">f<sub>${func.id}</sub>(x) =</span>
                </div>
                <div class="function-color" style="background-color: ${func.color};" data-func-id="${func.id}"></div>
            </div>
            <div class="function-expression-container">
                <input type="text" class="function-expression" value="${func.expression}" 
                       placeholder="输入函数表达式..." data-func-id="${func.id}">
                <div class="katex-display" id="katex-${func.id}"></div>
                <div class="error-message">${func.error || ''}</div>
            </div>
            <div class="function-actions">
                <button class="function-action-btn btn-toggle" data-func-id="${func.id}">
                    <i class="fas ${func.enabled ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    ${func.enabled ? '隐藏' : '显示'}
                </button>
                <button class="function-action-btn btn-condition" data-func-id="${func.id}">
                    <i class="fas fa-filter"></i> 条件
                </button>
                <button class="function-action-btn btn-remove" data-func-id="${func.id}">
                    <i class="fas fa-trash-alt"></i> 删除
                </button>
            </div>
        `;
        
        // 添加到容器
        document.getElementById('functionsList').appendChild(funcElement);
        
        // 绑定事件
        const colorElement = funcElement.querySelector('.function-color');
        const expressionInput = funcElement.querySelector('.function-expression');
        const toggleBtn = funcElement.querySelector('.btn-toggle');
        const conditionBtn = funcElement.querySelector('.btn-condition');
        const removeBtn = funcElement.querySelector('.btn-remove');
        const checkbox = funcElement.querySelector('input[type="checkbox"]');
        
        colorElement.addEventListener('click', (e) => {
            this.showColorPicker(func.id, func.color);
        });
        
        expressionInput.addEventListener('input', (e) => {
            this.updateFunctionExpression(func.id, e.target.value);
        });
        
        expressionInput.addEventListener('focus', (e) => {
            this.showAutocomplete(e.target, func.id);
        });
        
        expressionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.applyAutocomplete();
            }
        });
        
        toggleBtn.addEventListener('click', () => {
            this.toggleFunction(func.id);
        });
        
        conditionBtn.addEventListener('click', () => {
            this.editCondition(func.id);
        });
        
        removeBtn.addEventListener('click', () => {
            this.removeFunction(func.id);
        });
        
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.toggleFunctionSelection(func.id, e.target.checked);
            });
        }
        
        // 渲染KaTeX表达式
        this.renderKatexExpression(func.id);
        
        return funcElement;
    },
    
    // 渲染KaTeX表达式
    renderKatexExpression: function(funcId) {
        const func = this.functions.find(f => f.id === funcId);
        if (!func) return;
        
        const katexElement = document.getElementById(`katex-${funcId}`);
        if (!katexElement) return;
        
        // 清除之前的内容
        katexElement.innerHTML = '';
        
        if (!func.expression.trim()) {
            katexElement.style.display = 'none';
            return;
        }
        
        try {
            // 转换表达式为LaTeX格式
            let latexExpr = func.expression;
            
            // 处理隐式乘法
            latexExpr = latexExpr.replace(/(\d)([a-zA-Z])/g, '$1\\cdot $2');
            latexExpr = latexExpr.replace(/([a-zA-Z])(\d)/g, '$1\\cdot $2');
            latexExpr = latexExpr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1\\cdot $2');
            
            // 处理函数名
            latexExpr = latexExpr.replace(/\bsin\b/g, '\\sin');
            latexExpr = latexExpr.replace(/\bcos\b/g, '\\cos');
            latexExpr = latexExpr.replace(/\btan\b/g, '\\tan');
            latexExpr = latexExpr.replace(/\bsqrt\b/g, '\\sqrt');
            latexExpr = latexExpr.replace(/\blog\b/g, '\\log');
            latexExpr = latexExpr.replace(/\bln\b/g, '\\ln');
            latexExpr = latexExpr.replace(/\bexp\b/g, '\\exp');
            
            // 渲染KaTeX
            katex.render(`f_{${funcId}}(x) = ${latexExpr}`, katexElement, {
                throwOnError: false,
                displayMode: true,
                fontSize: 16
            });
            
            katexElement.style.display = 'block';
            func.katexRendered = latexExpr;
        } catch (error) {
            console.error('KaTeX渲染错误:', error);
            katexElement.style.display = 'none';
        }
    },
    
    // 显示自动补全
    showAutocomplete: function(inputElement, funcId) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        
        // 获取当前单词
        const textBeforeCursor = value.substring(0, cursorPos);
        const wordMatch = textBeforeCursor.match(/[a-zA-Z]+$/);
        
        if (!wordMatch) {
            this.hideAutocomplete();
            return;
        }
        
        const currentWord = wordMatch[0].toLowerCase();
        
        // 查找匹配项
        const matches = [];
        
        // 匹配函数
        this.autocompleteData.functions.forEach(func => {
            if (func.startsWith(currentWord)) {
                matches.push({
                    type: 'function',
                    value: func,
                    display: func
                });
            }
        });
        
        // 匹配常数
        this.autocompleteData.constants.forEach(constant => {
            if (constant.startsWith(currentWord)) {
                matches.push({
                    type: 'constant',
                    value: constant,
                    display: constant
                });
            }
        });
        
        // 匹配变量
        Object.keys(this.variables).forEach(varName => {
            if (varName.toLowerCase().startsWith(currentWord)) {
                matches.push({
                    type: 'variable',
                    value: varName,
                    display: `${varName} = ${this.variables[varName].value}`
                });
            }
        });
        
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        // 显示自动补全下拉菜单
        this.autocompleteData.active = true;
        this.autocompleteData.items = matches;
        this.autocompleteData.selectedIndex = 0;
        this.autocompleteData.inputElement = inputElement;
        this.autocompleteData.funcId = funcId;
        this.autocompleteData.wordStart = cursorPos - currentWord.length;
        this.autocompleteData.wordLength = currentWord.length;
        
        this.renderAutocompleteDropdown(inputElement);
    },
    
    // 渲染自动补全下拉菜单
    renderAutocompleteDropdown: function(inputElement) {
        const dropdown = document.getElementById('autocompleteDropdown');
        dropdown.innerHTML = '';
        
        this.autocompleteData.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `autocomplete-item ${index === this.autocompleteData.selectedIndex ? 'selected' : ''}`;
            itemElement.dataset.index = index;
            itemElement.innerHTML = `
                <span class="autocomplete-type">${item.type}</span>
                <span class="autocomplete-value">${item.display}</span>
            `;
            
            itemElement.addEventListener('click', () => {
                this.selectAutocompleteItem(index);
            });
            
            dropdown.appendChild(itemElement);
        });
        
        // 定位下拉菜单
        const rect = inputElement.getBoundingClientRect();
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.display = 'block';
    },
    
    // 选择自动补全项
    selectAutocompleteItem: function(index) {
        const item = this.autocompleteData.items[index];
        const input = this.autocompleteData.inputElement;
        const value = input.value;
        
        // 替换当前单词
        const newValue = value.substring(0, this.autocompleteData.wordStart) + 
                        item.value + 
                        value.substring(this.autocompleteData.wordStart + this.autocompleteData.wordLength);
        
        input.value = newValue;
        
        // 触发输入事件以更新表达式
        input.dispatchEvent(new Event('input'));
        
        // 移动光标到单词末尾
        const newCursorPos = this.autocompleteData.wordStart + item.value.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        this.hideAutocomplete();
    },
    
    // 应用自动补全（Tab键）
    applyAutocomplete: function() {
        if (!this.autocompleteData.active) return;
        
        this.selectAutocompleteItem(this.autocompleteData.selectedIndex);
    },
    
    // 隐藏自动补全
    hideAutocomplete: function() {
        this.autocompleteData.active = false;
        document.getElementById('autocompleteDropdown').style.display = 'none';
    },
    
    // 处理键盘事件
    handleKeyDown: function(e) {
        if (!this.autocompleteData.active) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.autocompleteData.selectedIndex = 
                (this.autocompleteData.selectedIndex + 1) % this.autocompleteData.items.length;
            this.renderAutocompleteDropdown(this.autocompleteData.inputElement);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.autocompleteData.selectedIndex = 
                (this.autocompleteData.selectedIndex - 1 + this.autocompleteData.items.length) % this.autocompleteData.items.length;
            this.renderAutocompleteDropdown(this.autocompleteData.inputElement);
        } else if (e.key === 'Escape') {
            this.hideAutocomplete();
        }
    },
    
    // 更新函数表达式
    updateFunctionExpression: function(funcId, expression) {
        const func = this.functions.find(f => f.id === funcId);
        if (func) {
            func.expression = expression;
            
            // 渲染KaTeX
            this.renderKatexExpression(funcId);
            
            // 验证表达式
            const isValid = this.validateFunctionExpression(funcId);
            
            // 只有当表达式有效或为空时才重绘
            if (isValid || !expression.trim()) {
                this.drawGraph();
            }
        }
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
            // 预处理表达式
            let expr = func.expression;
            
            // 处理隐式乘法（如2x -> 2*x）
            expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
            expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
            expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
            
            // 添加变量值
            const scope = {};
            Object.keys(this.variables).forEach(varName => {
                scope[varName] = this.variables[varName].value;
            });
            
            // 测试表达式是否有效
            const testExpr = expr.replace(/x/g, '(0)');
            math.evaluate(testExpr, scope);
            
            // 再测试一个随机值
            const randomX = Math.random() * 10 - 5;
            const randomExpr = expr.replace(/x/g, `(${randomX})`);
            math.evaluate(randomExpr, scope);
            
            return true;
        } catch (error) {
            // 提取错误信息
            let errorKey = 'unknown';
            let errorMsg = this.getErrorMessage(errorKey);
            
            if (error.message) {
                if (error.message.includes('undefined')) {
                    errorKey = 'undefined';
                } else if (error.message.includes('parentheses')) {
                    errorKey = 'parentheses';
                } else if (error.message.includes('Division by zero')) {
                    errorKey = 'division_by_zero';
                } else if (error.message.includes('invalid')) {
                    errorKey = 'invalid_argument';
                }
                errorMsg = this.getErrorMessage(errorKey);
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
    
    // 获取错误消息
    getErrorMessage: function(key) {
        const lang = this.settings.errorLanguage;
        return this.errorMessages[lang][key] || this.errorMessages[lang]['unknown'];
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
    
    // 编辑条件
    editCondition: function(funcId) {
        const func = this.functions.find(f => f.id === funcId);
        if (!func) return;
        
        // 创建条件编辑模态框
        this.showConditionModal(func);
    },
    
    // 删除函数
    removeFunction: function(funcId) {
        this.functions = this.functions.filter(f => f.id !== funcId);
        const funcElement = document.getElementById(`func-${funcId}`);
        if (funcElement) {
            funcElement.remove();
        }
        
        // 从选中集合中移除
        this.selectedFunctions.delete(funcId);
        
        // 更新批量控制状态
        this.updateBatchControls();
        
        // 如果没有函数了，显示空状态
        if (this.functions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>点击"添加"按钮创建第一个函数</p>';
            document.getElementById('functionsList').appendChild(emptyState);
        }
        
        this.drawGraph();
    },
    
    // 切换批量模式
    toggleBatchMode: function() {
        this.batchMode = !this.batchMode;
        
        const batchControls = document.getElementById('batchControls');
        const functionItems = document.querySelectorAll('.function-item');
        const checkboxes = document.querySelectorAll('.function-checkbox');
        
        if (this.batchMode) {
            batchControls.classList.add('active');
            functionItems.forEach(item => item.classList.add('batch-mode'));
            checkboxes.forEach(checkbox => checkbox.style.display = 'flex');
        } else {
            batchControls.classList.remove('active');
            functionItems.forEach(item => item.classList.remove('batch-mode'));
            checkboxes.forEach(checkbox => checkbox.style.display = 'none');
            
            // 清除所有选择
            this.selectedFunctions.clear();
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
        }
    },
    
    // 切换函数选择
    toggleFunctionSelection: function(funcId, selected) {
        if (selected) {
            this.selectedFunctions.add(funcId);
        } else {
            this.selectedFunctions.delete(funcId);
        }
        
        // 更新全选复选框状态
        this.updateSelectAllCheckbox();
    },
    
    // 选择所有函数
    selectAllFunctions: function(selectAll) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-func-id]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            const funcId = parseInt(checkbox.dataset.funcId);
            
            if (selectAll) {
                this.selectedFunctions.add(funcId);
            } else {
                this.selectedFunctions.delete(funcId);
            }
        });
    },
    
    // 更新全选复选框
    updateSelectAllCheckbox: function() {
        const selectAllCheckbox = document.getElementById('selectAllFunctions');
        const totalFunctions = this.functions.length;
        
        if (this.selectedFunctions.size === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (this.selectedFunctions.size === totalFunctions) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    },
    
    // 删除选中函数
    deleteSelectedFunctions: function() {
        if (this.selectedFunctions.size === 0) return;
        
        if (confirm(`确定要删除选中的 ${this.selectedFunctions.size} 个函数吗？`)) {
            this.selectedFunctions.forEach(funcId => {
                this.removeFunction(funcId);
            });
            
            this.selectedFunctions.clear();
            this.toggleBatchMode();
        }
    },
    
    // 更新批量控制
    updateBatchControls: function() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (this.selectedFunctions.size > 0) {
            deleteBtn.textContent = `删除选中 (${this.selectedFunctions.size})`;
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除选中';
        }
    },
    
    // 添加变量
    addVariable: function(name, value, options = {}) {
        const variable = {
            id: this.nextVariableId++,
            name: name,
            value: value,
            type: options.type || 'constant',
            min: options.min || 0,
            max: options.max || 10,
            step: options.step || 0.1
        };
        
        this.variables[name] = variable;
        this.renderVariableItem(variable);
        
        // 重新验证所有函数
        this.functions.forEach(func => {
            this.validateFunctionExpression(func.id);
        });
        
        this.drawGraph();
        
        return variable.id;
    },
    
    // 渲染变量项
    renderVariableItem: function(variable) {
        const variablesList = document.getElementById('variablesList');
        const emptyState = variablesList.querySelector('.empty-state');
        
        if (emptyState) {
            emptyState.remove();
        }
        
        const variableElement = document.createElement('div');
        variableElement.className = 'variable-item';
        variableElement.id = `var-${variable.id}`;
        
        if (variable.type === 'constant') {
            variableElement.innerHTML = `
                <div class="variable-header">
                    <span class="variable-name">${variable.name}</span>
                    <span class="variable-value">${variable.value}</span>
                </div>
                <div class="variable-actions">
                    <button class="function-action-btn" data-var-id="${variable.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="function-action-btn btn-remove" data-var-id="${variable.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </div>
            `;
        } else {
            variableElement.innerHTML = `
                <div class="variable-header">
                    <span class="variable-name">${variable.name}</span>
                    <span class="variable-value">${variable.value.toFixed(2)}</span>
                </div>
                <input type="range" class="variable-slider" min="${variable.min}" max="${variable.max}" 
                       step="${variable.step}" value="${variable.value}" data-var-name="${variable.name}">
                <div class="variable-range">${variable.min} 到 ${variable.max}</div>
                <div class="variable-actions">
                    <button class="function-action-btn" data-var-id="${variable.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="function-action-btn btn-remove" data-var-id="${variable.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </div>
            `;
            
            // 绑定滑块事件
            const slider = variableElement.querySelector('.variable-slider');
            slider.addEventListener('input', (e) => {
                const varName = e.target.dataset.varName;
                this.updateVariableValue(varName, parseFloat(e.target.value));
            });
        }
        
        variablesList.appendChild(variableElement);
        
        // 绑定按钮事件
        const editBtn = variableElement.querySelector('button[data-var-id]:not(.btn-remove)');
        const removeBtn = variableElement.querySelector('.btn-remove');
        
        editBtn.addEventListener('click', () => {
            this.editVariable(variable.id);
        });
        
        removeBtn.addEventListener('click', () => {
            this.removeVariable(variable.id);
        });
    },
    
    // 更新变量值
    updateVariableValue: function(name, value) {
        if (this.variables[name]) {
            this.variables[name].value = value;
            
            // 更新显示
            const valueElement = document.querySelector(`#var-${this.variables[name].id} .variable-value`);
            if (valueElement) {
                valueElement.textContent = value.toFixed(2);
            }
            
            // 重新验证所有函数
            this.functions.forEach(func => {
                this.validateFunctionExpression(func.id);
            });
            
            this.drawGraph();
        }
    },
    
    // 编辑变量
    editVariable: function(varId) {
        // 实现变量编辑逻辑
        console.log('编辑变量:', varId);
    },
    
    // 删除变量
    removeVariable: function(varId) {
        const variable = Object.values(this.variables).find(v => v.id === varId);
        if (!variable) return;
        
        delete this.variables[variable.name];
        
        const variableElement = document.getElementById(`var-${varId}`);
        if (variableElement) {
            variableElement.remove();
        }
        
        // 如果没有变量了，显示空状态
        const variablesList = document.getElementById('variablesList');
        if (Object.keys(this.variables).length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <p>尚未定义任何变量</p>
                <p class="small">常数和滑块变量可以在函数表达式中使用</p>
            `;
            variablesList.appendChild(emptyState);
        }
        
        // 重新验证所有函数
        this.functions.forEach(func => {
            this.validateFunctionExpression(func.id);
        });
        
        this.drawGraph();
    },
    
    // 更新函数选择下拉菜单
    updateFunctionSelect: function() {
        const select = document.getElementById('tableFunction');
        select.innerHTML = '<option value="">选择函数</option>';
        
        this.functions.forEach(func => {
            const option = document.createElement('option');
            option.value = func.id;
            option.textContent = `f${func.id}(x): ${func.expression.substring(0, 30)}${func.expression.length > 30 ? '...' : ''}`;
            select.appendChild(option);
        });
    },
    
    // 生成表格
    generateTable: function() {
        const funcId = document.getElementById('tableFunction').value;
        const start = parseFloat(document.getElementById('tableStart').value);
        const end = parseFloat(document.getElementById('tableEnd').value);
        const step = parseFloat(document.getElementById('tableStep').value);
        
        if (!funcId || start >= end || step <= 0) {
            alert('请检查输入参数');
            return;
        }
        
        const func = this.functions.find(f => f.id == funcId);
        if (!func) return;
        
        // 清空表格
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // 生成表格数据
        const scope = {};
        Object.keys(this.variables).forEach(varName => {
            scope[varName] = this.variables[varName].value;
        });
        
        let hasError = false;
        
        for (let x = start; x <= end + 0.0001; x += step) {
            const row = document.createElement('div');
            row.className = 'table-row';
            
            try {
                // 预处理表达式
                let expr = func.expression;
                expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
                expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
                expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
                
                const evaluatedExpr = expr.replace(/x/g, `(${x})`);
                const y = math.evaluate(evaluatedExpr, scope);
                
                row.innerHTML = `
                    <span class="table-col">${x.toFixed(3)}</span>
                    <span class="table-col">${isFinite(y) ? y.toFixed(3) : 'undefined'}</span>
                `;
            } catch (error) {
                row.innerHTML = `
                    <span class="table-col">${x.toFixed(3)}</span>
                    <span class="table-col" style="color: var(--danger-color);">错误</span>
                `;
                hasError = true;
            }
            
            tableBody.appendChild(row);
        }
        
        // 如果没有数据，显示空状态
        if (tableBody.children.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>选择函数并点击"生成表格"</p>';
            tableBody.appendChild(emptyState);
        }
    },
    
    // 绘制图形
    drawGraph: function() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = this.settings.theme === 'dark' ? '#1a1a1a' : 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格和坐标轴
        if (this.settings.showGrid) {
            this.drawGrid();
        }
        
        if (this.settings.axisLabels) {
            this.drawAxes();
        }
        
        // 绘制函数
        this.functions.forEach(func => {
            if (func.enabled && func.expression.trim() !== '' && !func.error) {
                this.plotFunction(func);
            }
        });
    },
    
    // 绘制网格
    drawGrid: function() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 计算网格密度
        let gridSpacing;
        switch (this.settings.gridDensity) {
            case 'low': gridSpacing = 2; break;
            case 'high': gridSpacing = 0.5; break;
            default: gridSpacing = 1; break;
        }
        
        // 计算网格线数量
        const pixelsPerUnit = this.view.scale;
        const gridPixelSpacing = pixelsPerUnit * gridSpacing;
        
        // 确保网格线间距合理
        if (gridPixelSpacing < 10) {
            gridSpacing *= 2;
        } else if (gridPixelSpacing > 100) {
            gridSpacing /= 2;
        }
        
        // 绘制网格线
        ctx.strokeStyle = this.settings.theme === 'dark' ? '#333' : '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        // 垂直网格线
        const leftX = this.toMathX(0);
        const rightX = this.toMathX(width);
        
        let startX = Math.floor(leftX / gridSpacing) * gridSpacing;
        for (let x = startX; x <= rightX; x += gridSpacing) {
            const canvasX = this.toCanvasX(x);
            
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, height);
            ctx.stroke();
        }
        
        // 水平网格线
        const topY = this.toMathY(0);
        const bottomY = this.toMathY(height);
        
        let startY = Math.floor(bottomY / gridSpacing) * gridSpacing;
        for (let y = startY; y <= topY; y += gridSpacing) {
            const canvasY = this.toCanvasY(y);
            
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(width, canvasY);
            ctx.stroke();
        }
    },
    
    // 绘制坐标轴
    drawAxes: function() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 坐标轴颜色
        ctx.strokeStyle = this.settings.theme === 'dark' ? '#666' : '#333';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = this.settings.theme === 'dark' ? '#ccc' : '#333';
        ctx.font = '12px Arial';
        
        // X轴
        const xAxisY = this.toCanvasY(0);
        if (xAxisY >= 0 && xAxisY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, xAxisY);
            ctx.lineTo(width, xAxisY);
            ctx.stroke();
            
            // X轴箭头
            ctx.beginPath();
            ctx.moveTo(width - 10, xAxisY - 5);
            ctx.lineTo(width, xAxisY);
            ctx.lineTo(width - 10, xAxisY + 5);
            ctx.fill();
            
            // X轴标签
            ctx.fillText('x', width - 15, xAxisY - 10);
        }
        
        // Y轴
        const yAxisX = this.toCanvasX(0);
        if (yAxisX >= 0 && yAxisX <= width) {
            ctx.beginPath();
            ctx.moveTo(yAxisX, 0);
            ctx.lineTo(yAxisX, height);
            ctx.stroke();
            
            // Y轴箭头
            ctx.beginPath();
            ctx.moveTo(yAxisX - 5, 10);
            ctx.lineTo(yAxisX, 0);
            ctx.lineTo(yAxisX + 5, 10);
            ctx.fill();
            
            // Y轴标签
            ctx.fillText('y', yAxisX + 10, 15);
        }
        
        // 刻度标签
        ctx.font = '10px Arial';
        
        // X轴刻度
        const xStep = this.getGridStep(this.toMathX(0), this.toMathX(width));
        let x = Math.floor(this.toMathX(0) / xStep) * xStep;
        
        while (x <= this.toMathX(width)) {
            const canvasX = this.toCanvasX(x);
            if (Math.abs(x) > 0.001 && canvasX >= 20 && canvasX <= width - 20) {
                ctx.fillText(x.toFixed(2), canvasX, xAxisY + 15);
                
                // 刻度线
                ctx.beginPath();
                ctx.moveTo(canvasX, xAxisY - 3);
                ctx.lineTo(canvasX, xAxisY + 3);
                ctx.stroke();
            }
            x += xStep;
        }
        
        // Y轴刻度
        const yStep = this.getGridStep(this.toMathY(height), this.toMathY(0));
        let y = Math.floor(this.toMathY(height) / yStep) * yStep;
        
        while (y <= this.toMathY(0)) {
            const canvasY = this.toCanvasY(y);
            if (Math.abs(y) > 0.001 && canvasY >= 20 && canvasY <= height - 20) {
                ctx.fillText(y.toFixed(2), yAxisX - 25, canvasY + 4);
                
                // 刻度线
                ctx.beginPath();
                ctx.moveTo(yAxisX - 3, canvasY);
                ctx.lineTo(yAxisX + 3, canvasY);
                ctx.stroke();
            }
            y += yStep;
        }
        
        // 原点标签
        if (this.toCanvasX(0) >= 10 && this.toCanvasX(0) <= width - 10 && 
            this.toCanvasY(0) >= 10 && this.toCanvasY(0) <= height - 10) {
            ctx.fillText('O', this.toCanvasX(0) - 15, this.toCanvasY(0) + 15);
        }
    },
    
    // 绘制函数
    plotFunction: function(func) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 设置样式
        ctx.strokeStyle = func.color;
        ctx.lineWidth = this.settings.lineWidth;
        ctx.beginPath();
        
        // 准备变量作用域
        const scope = {};
        Object.keys(this.variables).forEach(varName => {
            scope[varName] = this.variables[varName].value;
        });
        
        let isFirstPoint = true;
        let lastY = null;
        
        // 预处理表达式
        let expr = func.expression;
        expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
        expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
        
        // 检查条件
        let conditionFunc = null;
        if (func.condition) {
            try {
                conditionFunc = math.compile(func.condition);
            } catch (error) {
                console.error('条件表达式错误:', error);
            }
        }
        
        // 绘制函数
        for (let canvasX = 0; canvasX <= width; canvasX++) {
            const x = this.toMathX(canvasX);
            
            // 检查条件
            let conditionMet = true;
            if (conditionFunc) {
                try {
                    conditionMet = conditionFunc.evaluate({ x: x, ...scope });
                    if (typeof conditionMet !== 'boolean') {
                        conditionMet = true; // 如果条件不是布尔值，忽略它
                    }
                } catch (error) {
                    conditionMet = true;
                }
            }
            
            if (!conditionMet) {
                isFirstPoint = true;
                lastY = null;
                continue;
            }
            
            try {
                const evaluatedExpr = expr.replace(/x/g, `(${x})`);
                const y = math.evaluate(evaluatedExpr, scope);
                
                // 检查y是否有效
                if (isFinite(y)) {
                    const canvasY = this.toCanvasY(y);
                    
                    // 检查y是否在视图范围内
                    if (canvasY >= -100 && canvasY <= height + 100) {
                        if (isFirstPoint) {
                            ctx.moveTo(canvasX, canvasY);
                            isFirstPoint = false;
                        } else {
                            // 检查是否有断点（函数不连续）
                            if (lastY !== null && Math.abs(y - lastY) > 10) {
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
    
    // 切换侧边栏
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggleIcon');
        
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-left';
        } else {
            toggleIcon.className = 'fas fa-chevron-right';
        }
    },
    
    // 显示设置
    showSettings: function() {
        // 更新设置控件值
        document.getElementById('languageSelect').value = this.settings.language;
        document.getElementById('errorLanguage').value = this.settings.errorLanguage;
        document.getElementById('gridDensity').value = this.settings.gridDensity;
        document.getElementById('showGrid').checked = this.settings.showGrid;
        document.getElementById('axisLabels').checked = this.settings.axisLabels;
        document.getElementById('zoomSensitivity').value = this.settings.zoomSensitivity;
        document.getElementById('dragSensitivity').value = this.settings.dragSensitivity;
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('lineWidth').value = this.settings.lineWidth;
        
        // 更新显示值
        document.getElementById('zoomSensitivityValue').textContent = this.settings.zoomSensitivity;
        document.getElementById('dragSensitivityValue').textContent = this.settings.dragSensitivity;
        document.getElementById('lineWidthValue').textContent = this.settings.lineWidth;
        
        this.showModal('settingsModal');
    },
    
    // 保存设置
    saveSettings: function() {
        this.settings.language = document.getElementById('languageSelect').value;
        this.settings.errorLanguage = document.getElementById('errorLanguage').value;
        this.settings.gridDensity = document.getElementById('gridDensity').value;
        this.settings.showGrid = document.getElementById('showGrid').checked;
        this.settings.axisLabels = document.getElementById('axisLabels').checked;
        this.settings.zoomSensitivity = parseFloat(document.getElementById('zoomSensitivity').value);
        this.settings.dragSensitivity = parseFloat(document.getElementById('dragSensitivity').value);
        this.settings.theme = document.getElementById('themeSelect').value;
        this.settings.lineWidth = parseFloat(document.getElementById('lineWidth').value);
        
        // 保存到本地存储
        localStorage.setItem('graphAppSettings', JSON.stringify(this.settings));
        
        // 应用设置
        this.applySettings();
        
        // 隐藏模态框
        this.hideModal('settingsModal');
    },
    
    // 重置设置
    resetSettings: function() {
        this.settings = {
            language: 'zh-CN',
            errorLanguage: 'zh-CN',
            gridDensity: 'medium',
            showGrid: true,
            axisLabels: true,
            zoomSensitivity: 1.0,
            dragSensitivity: 1.0,
            theme: 'light',
            lineWidth: 2
        };
        
        // 保存到本地存储
        localStorage.setItem('graphAppSettings', JSON.stringify(this.settings));
        
        // 应用设置
        this.applySettings();
        
        // 更新设置控件
        this.showSettings();
    },
    
    // 加载设置
    loadSettings: function() {
        const savedSettings = localStorage.getItem('graphAppSettings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (error) {
                console.error('加载设置失败:', error);
            }
        }
    },
    
    // 应用设置
    applySettings: function() {
        // 应用主题
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // 更新缩放显示
        this.updateZoomDisplay();
        
        // 重绘图形
        this.drawGraph();
    },
    
    // 重置视图
    resetView: function() {
        this.view = {
            centerX: 0,
            centerY: 0,
            scale: 50,
            minScale: 5,
            maxScale: 500
        };
        
        this.updateZoomDisplay();
        this.drawGraph();
    },
    
    // 导出图像
    exportImage: function() {
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 绘制到临时画布
        const originalTheme = this.settings.theme;
        this.settings.theme = 'light'; // 导出时使用浅色主题
        this.drawToCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
        this.settings.theme = originalTheme;
        
        // 创建下载链接
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `函数绘图_${timestamp}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        
        // 重新绘制原始画布
        this.drawGraph();
    },
    
    // 绘制到指定画布
    drawToCanvas: function(ctx, width, height) {
        // 保存原始状态
        const originalCanvas = this.canvas;
        const originalCtx = this.ctx;
        const originalWidth = originalCanvas.width;
        const originalHeight = originalCanvas.height;
        
        // 临时替换
        this.canvas = { width, height };
        this.ctx = ctx;
        
        // 绘制
        this.drawGraph();
        
        // 恢复原始状态
        this.canvas = originalCanvas;
        this.ctx = originalCtx;
    },
    
    // 切换全屏
    toggleFullscreen: function() {
        const container = document.querySelector('.main-canvas-container');
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    },
    
    // 显示模态框
    showModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },
    
    // 隐藏模态框
    hideModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },
    
    // 显示条件模态框
    showConditionModal: function(func) {
        // 实现条件编辑模态框
        console.log('显示条件模态框:', func);
    },
    
    // 获取随机颜色
    getRandomColor: function() {
        const colors = [
            '#FF3B30', '#4CD964', '#007AFF', '#5856D6',
            '#FF9500', '#FF2D55', '#8E8E93', '#5AC8FA',
            '#34C759', '#AF52DE', '#FF9500', '#FFCC00'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', () => {
    AdvancedGraphApp.init();
});

// 处理全屏变化
document.addEventListener('fullscreenchange', () => {
    AdvancedGraphApp.resizeCanvas();
    AdvancedGraphApp.drawGraph();
});

document.addEventListener('webkitfullscreenchange', () => {
    AdvancedGraphApp.resizeCanvas();
    AdvancedGraphApp.drawGraph();
});

document.addEventListener('msfullscreenchange', () => {
    AdvancedGraphApp.resizeCanvas();
    AdvancedGraphApp.drawGraph();
});
