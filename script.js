// Supabase Configuration
const SUPABASE_URL = 'https://mldxtcwdmefmxpwyicqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHh0Y3dkbWVmbXhwd3lpY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTg5MTMsImV4cCI6MjEwMjE5NDkxM30.pmAwApBdgNqdSAPTFY4IxF24bJbCrYJVujkvGmt3aeA';

// Initialize db
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Constants
const COMPANY_ID = '2253';
const CASHIER_NAME = 'Funmi Arijeem';
const DELIVERY_FEE = 100;
const PAYMENT_MODE = 'transfer';

// Global state
let products = [];
let presellers = [];
let orders = [];
let drivers = ['MR AKINYEMI', 'MR BOLA', 'MR JOHNSON', 'MR SUNDAY', 'MR EMMANUEL'];
let routes = ['ROUTE 1', 'ROUTE 2', 'ROUTE 3', 'ROUTE 4', 'ROUTE 5', 'ROUTE 6', 'ROUTE 7', 'ROUTE 8', 'ROUTE 9', 'ROUTE 10'];
let currentOrderItems = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadProducts();
    await loadPresellers();
    await loadDrivers();
    await loadRoutes();
    await loadOrders();
    setDefaultOrderDate();
    updateDashboard();
    addProductRow();
    setupEventListeners();
}

function setDefaultOrderDate(force = false) {
    const dateInput = document.getElementById('order-entry-date');
    const timeInput = document.getElementById('order-entry-time');
    const today = new Date();

    if (dateInput && (force || !dateInput.value)) {
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    if (timeInput && (force || !timeInput.value)) {
        const hh = String(today.getHours()).padStart(2, '0');
        const min = String(today.getMinutes()).padStart(2, '0');
        timeInput.value = `${hh}:${min}`;
    }

    updateOrderNumberPreview();
}

function toggleOrderNumberOverride(enabled) {
    const input = document.getElementById('custom-serial-input');
    if (!input) return;
    input.disabled = !enabled;
    if (enabled) {
        input.focus();
    } else {
        input.value = '';
    }
    updateOrderNumberPreview();
}

function updateOrderNumberPreview() {
    const toggle = document.getElementById('override-order-number-toggle');
    const customInput = document.getElementById('custom-serial-input');
    const previewEl = document.getElementById('order-number-preview');
    const dateInput = document.getElementById('order-entry-date');

    if (!previewEl) return;

    // Determine YYMMDD prefix from date picker or current date
    let dateObj = new Date();
    if (dateInput && dateInput.value) {
        const [y, m, d] = dateInput.value.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            dateObj = new Date(y, m - 1, d);
        }
    }

    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const prefix = `${year}${month}${day}${COMPANY_ID}`;

    if (toggle && toggle.checked && customInput) {
        const cleanSerial = customInput.value.replace(/\D/g, '');
        customInput.value = cleanSerial;
        if (cleanSerial.length > 0) {
            const paddedSerial = cleanSerial.padStart(4, '0');
            previewEl.value = `${prefix}${paddedSerial}`;
        } else {
            previewEl.value = `${prefix}XXXX`;
        }
    } else {
        previewEl.value = `AUTO (${prefix}XXXX)`;
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('edit-product-form').addEventListener('submit', handleEditProduct);
    document.getElementById('add-preseller-form').addEventListener('submit', handleAddPreseller);
    document.getElementById('edit-preseller-form').addEventListener('submit', handleEditPreseller);
    document.getElementById('add-driver-form').addEventListener('submit', handleAddDriver);
    document.getElementById('add-route-form').addEventListener('submit', handleAddRoute);

    // Close modal when backdrop is clicked
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
}

// Navigation
function showScreen(screenName, event) {
    if (event) {
        event.preventDefault();
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show selected screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.screen === screenName) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('sidebar-overlay')?.classList.remove('active');

    // Load data based on screen
    if (screenName === 'dashboard') {
        updateDashboard();
    } else if (screenName === 'new-order') {
        setDefaultOrderDate();
    } else if (screenName === 'orders') {
        loadOrders();
    } else if (screenName === 'products') {
        loadProducts();
    } else if (screenName === 'presellers') {
        loadPresellers();
    }
}

function toggleMobileMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// Products
async function loadProducts() {
    try {
        const { data, error } = await db
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;
        products = data;
        renderProductsTable();
        updateProductSelects();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Error loading products. Please check your Supabase configuration.');
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>₦${formatNumber(product.price)}</td>
            <td>${product.active ? 'Active' : 'Inactive'}</td>
            <td class="table-actions">
                <button class="edit-btn" onclick="showEditProductModal(${product.id})">Edit</button>
                <button class="delete-btn" onclick="toggleProductStatus(${product.id}, ${!product.active})">
                    ${product.active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function updateProductSelects() {
    const activeProducts = products.filter(p => p.active);
    const options = activeProducts.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`).join('');
    
    document.querySelectorAll('.product-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `<option value="">Select Product</option>${options}`;
        if (currentValue) select.value = currentValue;
    });
}

async function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);

    try {
        const { data, error } = await db
            .from('products')
            .insert([{ name, price, active: true }])
            .select();

        if (error) throw error;
        
        closeAddProductModal();
        document.getElementById('add-product-form').reset();
        await loadProducts();
        alert('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product. Please try again.');
    }
}

async function handleEditProduct(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-product-id').value);
    const name = document.getElementById('edit-product-name').value.trim();
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const active = document.getElementById('edit-product-active').value === 'true';

    try {
        const { error } = await db
            .from('products')
            .update({ name, price, active })
            .eq('id', id);

        if (error) throw error;
        
        closeEditProductModal();
        await loadProducts();
        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product. Please try again.');
    }
}

async function toggleProductStatus(id, active) {
    try {
        const { error } = await db
            .from('products')
            .update({ active })
            .eq('id', id);

        if (error) throw error;
        await loadProducts();
    } catch (error) {
        console.error('Error toggling product status:', error);
        alert('Error updating product status. Please try again.');
    }
}

// Presellers
async function loadPresellers() {
    try {
        const { data, error } = await db
            .from('presellers')
            .select('*')
            .order('name');

        if (error) throw error;
        presellers = data;
        renderPresellersTable();
        updatePresellerSelect();
    } catch (error) {
        console.error('Error loading presellers:', error);
        alert('Error loading presellers. Please check your Supabase configuration.');
    }
}

function renderPresellersTable() {
    const tbody = document.getElementById('presellers-table-body');
    tbody.innerHTML = presellers.map(preseller => `
        <tr>
            <td>${preseller.name}</td>
            <td>${preseller.active ? 'Active' : 'Inactive'}</td>
            <td class="table-actions">
                <button class="edit-btn" onclick="showEditPresellerModal(${preseller.id})">Edit</button>
                <button class="delete-btn" onclick="togglePresellerStatus(${preseller.id}, ${!preseller.active})">
                    ${preseller.active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function updatePresellerSelect() {
    const activePresellers = presellers.filter(p => p.active);
    const options = activePresellers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('preseller-select').innerHTML = `<option value="">SELECT LOADOUT</option>${options}`;
}

async function handleAddPreseller(e) {
    e.preventDefault();
    const nameInput = document.getElementById('preseller-name');
    const name = nameInput.value.trim().toUpperCase();

    try {
        const { data, error } = await db
            .from('presellers')
            .insert([{ name, active: true }])
            .select();

        if (error) throw error;
        
        closeAddPresellerModal();
        nameInput.value = '';
        await loadPresellers();
        alert('Preseller added successfully!');
    } catch (error) {
        console.error('Error adding preseller:', error);
        alert('Error adding preseller. Please try again.');
    }
}

async function handleEditPreseller(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-preseller-id').value);
    const name = document.getElementById('edit-preseller-name').value.trim().toUpperCase();
    const active = document.getElementById('edit-preseller-active').value === 'true';

    try {
        const { error } = await db
            .from('presellers')
            .update({ name, active })
            .eq('id', id);

        if (error) throw error;
        
        closeEditPresellerModal();
        await loadPresellers();
        alert('Preseller updated successfully!');
    } catch (error) {
        console.error('Error updating preseller:', error);
        alert('Error updating preseller. Please try again.');
    }
}

async function togglePresellerStatus(id, active) {
    try {
        const { error } = await db
            .from('presellers')
            .update({ active })
            .eq('id', id);

        if (error) throw error;
        await loadPresellers();
    } catch (error) {
        console.error('Error toggling preseller status:', error);
        alert('Error updating preseller status. Please try again.');
    }
}

function searchPresellers() {
    const query = document.getElementById('preseller-search').value.toLowerCase();
    const filtered = presellers.filter(p => 
        p.name.toLowerCase().includes(query)
    );
    
    const tbody = document.getElementById('presellers-table-body');
    tbody.innerHTML = filtered.map(preseller => `
        <tr>
            <td>${preseller.name}</td>
            <td>${preseller.active ? 'Active' : 'Inactive'}</td>
            <td class="table-actions">
                <button class="edit-btn" onclick="showEditPresellerModal(${preseller.id})">Edit</button>
                <button class="delete-btn" onclick="togglePresellerStatus(${preseller.id}, ${!preseller.active})">
                    ${preseller.active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Orders
async function loadOrders() {
    try {
        const { data, error } = await db
            .from('orders')
            .select(`
                *,
                preseller:presellers(name)
            `)
            .order('order_date', { ascending: false });

        if (error) throw error;
        orders = data;
        renderOrdersTable();
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Error loading orders. Please check your Supabase configuration.');
    }
}

function renderOrdersTable(filteredOrders = null) {
    const ordersToRender = filteredOrders || orders;
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = ordersToRender.map(order => `
        <tr>
            <td>${order.order_number}</td>
            <td>${order.preseller?.name || 'N/A'}</td>
            <td>${formatDate(order.order_date)}</td>
            <td>₦${formatNumber(order.total)}</td>
            <td class="table-actions">
                <button class="view-btn" onclick="viewOrder(${order.id})">View</button>
                <button class="print-btn" onclick="printOrder(${order.id})">Print</button>
            </td>
        </tr>
    `).join('');
}

function searchOrders() {
    const query = document.getElementById('order-search').value.toLowerCase();
    const filtered = orders.filter(order => 
        order.order_number.toLowerCase().includes(query) ||
        (order.preseller?.name || '').toLowerCase().includes(query) ||
        formatDate(order.order_date).includes(query)
    );
    renderOrdersTable(filtered);
}

// Order Form
function addProductRow() {
    const container = document.getElementById('product-rows');
    const rowId = Date.now();
    const activeProducts = products.filter(p => p.active);
    const options = activeProducts.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`).join('');
    
    const row = document.createElement('div');
    row.className = 'product-row';
    row.id = `product-row-${rowId}`;
    row.innerHTML = `
        <div class="product-row-select-wrap">
            <label class="mobile-only-label">Product</label>
            <select class="product-select" onchange="onProductSelect(this, ${rowId})">
                <option value="">Select Product</option>
                ${options}
            </select>
        </div>
        <div class="product-row-field">
            <label class="mobile-only-label">Qty</label>
            <input type="number" class="quantity-input" min="1" value="0" placeholder="Qty" onchange="calculateRowTotal(${rowId})" oninput="calculateRowTotal(${rowId})">
        </div>
        <div class="product-row-field">
            <label class="mobile-only-label">Price</label>
            <input type="text" class="unit-price" value="₦0.00" readonly placeholder="Unit Price">
        </div>
        <div class="product-row-field">
            <label class="mobile-only-label">Total</label>
            <input type="text" class="row-total" value="₦0.00" readonly placeholder="Total">
        </div>
        <div class="product-row-actions">
            <button type="button" class="remove-btn" onclick="removeProductRow(${rowId})">Remove</button>
        </div>
    `;
    
    container.appendChild(row);
}

function removeProductRow(rowId) {
    const row = document.getElementById(`product-row-${rowId}`);
    if (row) {
        row.remove();
        calculateOrderTotal();
    }
}

function onProductSelect(select, rowId) {
    const row = document.getElementById(`product-row-${rowId}`);
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption.dataset.price || 0;
    
    row.querySelector('.unit-price').value = `₦${formatNumber(price)}`;
    calculateRowTotal(rowId);
}

function calculateRowTotal(rowId) {
    const row = document.getElementById(`product-row-${rowId}`);
    const select = row.querySelector('.product-select');
    const selectedOption = select.options[select.selectedIndex];
    const price = parseFloat(selectedOption.dataset.price) || 0;
    const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
    const total = price * quantity;
    
    row.querySelector('.row-total').value = `₦${formatNumber(total)}`;
    calculateOrderTotal();
}

function calculateOrderTotal() {
    const rows = document.querySelectorAll('.product-row');
    let subtotal = 0;
    
    rows.forEach(row => {
        const totalText = row.querySelector('.row-total').value.replace(/[₦,]/g, '');
        subtotal += parseFloat(totalText) || 0;
    });
    
    const grandTotal = subtotal + DELIVERY_FEE;
    
    document.getElementById('subtotal').textContent = `₦${formatNumber(subtotal)}`;
    document.getElementById('grand-total').textContent = `₦${formatNumber(grandTotal)}`;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const presellerId = document.getElementById('preseller-select').value;
    if (!presellerId) {
        alert('Please select a Loadout Preseller');
        return;
    }
    
    const rows = document.querySelectorAll('.product-row');
    const orderItems = [];
    let validItems = false;
    
    rows.forEach(row => {
        const select = row.querySelector('.product-select');
        const productId = select.value;
        const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
        
        if (productId && quantity > 0) {
            const selectedOption = select.options[select.selectedIndex];
            const productName = selectedOption.text;
            const unitPrice = parseFloat(selectedOption.dataset.price);
            const totalPrice = unitPrice * quantity;
            
            orderItems.push({
                product_id: parseInt(productId),
                product_name: productName,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
            validItems = true;
        }
    });
    
    if (!validItems) {
        alert('Please add at least one product with quantity greater than zero');
        return;
    }
    
    try {
        // Determine entry date & time from form inputs
        const dateInputValue = document.getElementById('order-entry-date')?.value;
        const timeInputValue = document.getElementById('order-entry-time')?.value;
        const driverName = document.getElementById('driver-select')?.value || '';
        const routeName = document.getElementById('route-select')?.value || '';

        const now = new Date();
        let targetDate = new Date();

        if (dateInputValue) {
            const [y, m, d] = dateInputValue.split('-').map(Number);
            let hours = now.getHours();
            let minutes = now.getMinutes();

            if (timeInputValue) {
                const [th, tm] = timeInputValue.split(':').map(Number);
                if (!isNaN(th)) hours = th;
                if (!isNaN(tm)) minutes = tm;
            }

            targetDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
        }

        // Determine order number (Auto or Custom Override)
        const toggle = document.getElementById('override-order-number-toggle');
        const customSerialInput = document.getElementById('custom-serial-input');
        const isCustomOverride = (toggle && toggle.checked && customSerialInput && customSerialInput.value.trim().length > 0);
        let serial = 0;
        let orderNumber = '';

        if (isCustomOverride) {
            const cleanSerial = customSerialInput.value.replace(/\D/g, '').padStart(4, '0');
            orderNumber = generateOrderNumber(cleanSerial, targetDate);
        } else {
            // Get next order serial from database counter
            const { data: counterData, error: counterError } = await db.rpc('get_next_order_serial');
            if (counterError) throw counterError;
            serial = counterData || 1;
            orderNumber = generateOrderNumber(serial, targetDate);
        }

        // Check if orderNumber already exists in database
        let finalOrderNumber = orderNumber;
        const { data: existingOrder } = await db
            .from('orders')
            .select('id')
            .eq('order_number', finalOrderNumber)
            .maybeSingle();

        if (existingOrder) {
            if (isCustomOverride) {
                alert(`Order creation failed: Invoice Number '${finalOrderNumber}' already exists in your database!\n\nPlease enter a different 4-digit serial (e.g. 0012, 0056) or uncheck custom order number edit.`);
                return;
            } else {
                // Auto-increment serial if default counter collided with existing record
                let suffixNum = parseInt(serial) || 1;
                while (true) {
                    suffixNum++;
                    const candidateNumber = generateOrderNumber(suffixNum, targetDate);
                    const { data: check } = await db
                        .from('orders')
                        .select('id')
                        .eq('order_number', candidateNumber)
                        .maybeSingle();
                    if (!check) {
                        finalOrderNumber = candidateNumber;
                        break;
                    }
                }
            }
        }

        const orderDate = targetDate.toISOString();
        
        const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
        const total = subtotal + DELIVERY_FEE;
        
        // Save order
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .insert([{
                order_number: finalOrderNumber,
                order_date: orderDate,
                preseller_id: parseInt(presellerId),
                driver_name: driverName,
                route_name: routeName,
                payment_method: PAYMENT_MODE,
                cashier_name: CASHIER_NAME,
                outstanding_balance: 0,
                delivery_fee: DELIVERY_FEE,
                subtotal,
                total
            }])
            .select();
        
        if (orderError) throw orderError;
        
        const orderId = orderData[0].id;
        
        // Save order items
        const itemsToInsert = orderItems.map(item => ({
            ...item,
            order_id: orderId
        }));
        
        const { error: itemsError } = await db
            .from('order_items')
            .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
        
        // Generate receipt
        const preseller = presellers.find(p => p.id === parseInt(presellerId));
        generateReceipt(finalOrderNumber, orderDate, preseller.name, orderItems, subtotal, total, driverName, routeName);
        
        // Reset form & restore default date & preview
        document.getElementById('order-form').reset();
        const toggleEl = document.getElementById('override-order-number-toggle');
        if (toggleEl) toggleEl.checked = false;
        toggleOrderNumberOverride(false);
        setDefaultOrderDate(true);
        populateDrivers();
        populateRoutes();
        document.getElementById('product-rows').innerHTML = '';
        addProductRow();
        calculateOrderTotal();
        
        // Update dashboard
        await updateDashboard();
        
        alert('Order created successfully!');
    } catch (error) {
        console.error('Error creating order:', error);
        if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
            alert(`Order creation failed: This Order Number already exists in the database!\n\nPlease use a different 4-digit serial or uncheck custom order number edit.`);
        } else {
            alert('Error creating order: ' + (error.message || 'Please check input details and try again.'));
        }
    }
}

function generateOrderNumber(serial, dateObj = new Date()) {
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const serialStr = serial.toString().padStart(4, '0');
    return `${year}${month}${day}${COMPANY_ID}${serialStr}`;
}

async function viewOrder(orderId) {
    try {
        const { data: order, error: orderError } = await db
            .from('orders')
            .select(`
                *,
                preseller:presellers(name)
            `)
            .eq('id', orderId)
            .single();
        
        if (orderError) throw orderError;
        
        const { data: items, error: itemsError } = await db
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);
        
        if (itemsError) throw itemsError;
        
        generateReceipt(
            order.order_number,
            order.order_date,
            order.preseller?.name || 'N/A',
            items,
            order.subtotal,
            order.total,
            order.driver_name || '',
            order.route_name || ''
        );
    } catch (error) {
        console.error('Error viewing order:', error);
        alert('Error loading order details. Please try again.');
    }
}

async function printOrder(orderId) {
    await viewOrder(orderId);
    printReceipt();
}

let currentOrderNumberForPDF = '';

function downloadPDF() {
    const element = document.getElementById('receipt-content');
    if (!element) {
        window.print();
        return;
    }

    // Refresh barcode SVG to ensure active rendering
    if (currentOrderNumberForPDF) {
        try {
            JsBarcode("#barcode", currentOrderNumberForPDF, {
                format: "CODE128",
                width: 2.0,
                height: 46,
                displayValue: false,
                margin: 0
            });
        } catch (e) {}
    }

    const filename = `Receipt_${currentOrderNumberForPDF || 'Order'}.pdf`;

    const opt = {
        margin:       [4, 4, 4, 4],
        filename:     filename,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    try {
        html2pdf().set(opt).from(element).save().catch(err => {
            console.warn("html2pdf failed, falling back to print:", err);
            window.print();
        });
    } catch (err) {
        console.warn("PDF library error, falling back to print:", err);
        window.print();
    }
}

// Receipt
function generateReceipt(orderNumber, orderDate, presellerName, items, subtotal, total, driverName = '', routeName = '') {
    currentOrderNumberForPDF = orderNumber;
    const receiptContent = document.getElementById('receipt-content');

    const itemsRowsHtml = items.map(item => `
        <tr>
            <td class="r-item-name">${item.product_name}</td>
            <td class="r-item-qty">${item.quantity}</td>
            <td class="r-item-price">${formatReceiptNumber(item.unit_price)}</td>
            <td class="r-item-total">${formatReceiptNumber(item.total_price)}</td>
        </tr>
    `).join('');

    receiptContent.innerHTML = `
        <div class="receipt-header">
            <div class="r-company">ARIJEEM MULTI-PURPOSE</div>
            <div class="r-address">7, ALHAJI YUSUF, ABORU, IYANA IPAJA,<br>LAGOS</div>
        </div>

        <table class="r-info-table">
            <tr>
                <td class="r-label">Order Entry Date</td>
                <td class="r-value r-value-bold">${formatDateTime(orderDate)}</td>
            </tr>
            <tr>
                <td class="r-label">Order Number</td>
                <td class="r-value r-value-bold">${orderNumber}</td>
            </tr>
            <tr>
                <td class="r-label">Payment Mode</td>
                <td class="r-value r-value-bold">transfer</td>
            </tr>
            <tr>
                <td class="r-label">Customer Name</td>
                <td class="r-value r-value-bold">
                    ${presellerName}
                    ${driverName ? `<br>${driverName}` : ''}
                    ${routeName ? `<br>${routeName}` : ''}
                </td>
            </tr>
            <tr>
                <td class="r-label">Outstanding<br>balance</td>
                <td class="r-value r-value-bold">NGN0.00</td>
            </tr>
            <tr>
                <td class="r-label">Cashier Name</td>
                <td class="r-value r-value-bold">Funmi Arijeem</td>
            </tr>
        </table>

        <div class="r-section-title">Ordered Items</div>

        <table class="r-items-table">
            <thead>
                <tr>
                    <th class="r-item-name">Item</th>
                    <th class="r-item-qty">Qty</th>
                    <th class="r-item-price">Unit<br>Price(NGN)</th>
                    <th class="r-item-total">Total<br>Price(NGN)</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRowsHtml}
            </tbody>
        </table>

        <table class="r-totals-table">
            <tr>
                <td class="r-total-label">Sub Total</td>
                <td class="r-total-value">NGN${formatReceiptNumber(subtotal)}</td>
            </tr>
            <tr>
                <td class="r-total-label r-border-bottom">Delivery fee</td>
                <td class="r-total-value r-border-bottom">NGN${formatReceiptNumber(DELIVERY_FEE)}</td>
            </tr>
            <tr class="r-final-total-row">
                <td class="r-total-label r-total-main">Total</td>
                <td class="r-total-value r-total-main">NGN${formatReceiptNumber(total)}</td>
            </tr>
        </table>

        <div class="r-barcode-section">
            <svg id="barcode"></svg>
            <div class="r-barcode-num">${orderNumber}</div>
        </div>
    `;

    // Unhide modal first so SVG is visible in DOM
    document.getElementById('receipt-modal').classList.remove('hidden');

    // Generate barcode
    const renderBar = () => {
        try {
            JsBarcode("#barcode", orderNumber, {
                format: "CODE128",
                width: 2.0,
                height: 46,
                displayValue: false,
                margin: 0
            });
        } catch (e) {
            console.error("Barcode generation error:", e);
        }
    };

    renderBar();
    setTimeout(renderBar, 50);
}

function printReceipt() {
    window.print();
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
}

// Dashboard
async function updateDashboard() {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
        
        const { data: todayOrders, error: ordersError } = await db
            .from('orders')
            .select('total')
            .gte('order_date', startOfDay)
            .lte('order_date', endOfDay);
        
        if (ordersError) throw ordersError;
        
        const orderCount = todayOrders.length;
        const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
        
        document.getElementById('today-orders').textContent = orderCount;
        document.getElementById('today-sales').textContent = `₦${formatNumber(totalSales)}`;
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Modals
function showAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

function showEditProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-active').value = product.active.toString();
        document.getElementById('edit-product-modal').classList.remove('hidden');
    }
}

function closeEditProductModal() {
    document.getElementById('edit-product-modal').classList.add('hidden');
}

function showAddPresellerModal() {
    document.getElementById('add-preseller-modal').classList.remove('hidden');
}

function closeAddPresellerModal() {
    document.getElementById('add-preseller-modal').classList.add('hidden');
}

function showEditPresellerModal(presellerId) {
    const preseller = presellers.find(p => p.id === presellerId);
    if (preseller) {
        document.getElementById('edit-preseller-id').value = preseller.id;
        document.getElementById('edit-preseller-name').value = preseller.name;
        document.getElementById('edit-preseller-active').value = preseller.active.toString();
        document.getElementById('edit-preseller-modal').classList.remove('hidden');
    }
}

function closeEditPresellerModal() {
    document.getElementById('edit-preseller-modal').classList.add('hidden');
}

// Utility functions
function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format numbers for receipt: comma-separated, 2 decimal places, no currency symbol
function formatReceiptNumber(num) {
    return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Initialize default data if needed
async function initializeDefaultData() {
    // Check if products exist
    const { data: existingProducts } = await db.from('products').select('id').limit(1);
    
    if (!existingProducts || existingProducts.length === 0) {
        // Insert default products
        const defaultProducts = [
            { name: 'Pepsi Pet 60cl', price: 4300, active: true },
            { name: 'Pepsi RGB 50cl', price: 5600, active: true },
            { name: '7up RGB 35cl', price: 3100, active: true },
            { name: 'Kommando 30cl', price: 3100, active: true },
            { name: 'Kommando 50cl', price: 4250, active: true },
            { name: 'Kommando RGB', price: 3220, active: true }
        ];
        
        await db.from('products').insert(defaultProducts);
    }
    
    // Check if presellers exist
    const { data: existingPresellers } = await db.from('presellers').select('id').limit(1);
    
    if (!existingPresellers || existingPresellers.length === 0) {
        // Insert default presellers
        const defaultPresellers = [
            'LOADOUT AYOMIDE', 'LOADOUT MRS BISI', 'LOADOUT HELEN', 'LOADOUT MR SUNDAY',
            'LOADOUT MRS TOLU', 'LOADOUT MISS WUNMI', 'LOADOUT MRS BUNMI', 'LOADOUT HAWAU',
            'LOADOUT FATIMOT', 'LOADOUT CONFIDENCE', 'LOADOUT TIMILEYIN', 'LOADOUT MRS KEMI',
            'LOADOUT OMOLARA', 'LOADOUT ESTHER'
        ].map(name => ({ name, active: true }));
        
        await db.from('presellers').insert(defaultPresellers);
    }
    
    // Check if order counter exists
    const { data: existingCounter } = await db.from('order_counter').select('id').limit(1);
    
    if (!existingCounter || existingCounter.length === 0) {
        await db.from('order_counter').insert([{ current_serial: 0 }]);
    }
}

// Drivers & Routes Management
async function loadDrivers() {
    try {
        const { data, error } = await db.from('drivers').select('*').eq('active', true).order('name');
        if (!error && data && data.length > 0) {
            drivers = data.map(d => d.name);
        } else {
            const stored = localStorage.getItem('arijeem_drivers');
            if (stored) drivers = JSON.parse(stored);
        }
    } catch (e) {
        const stored = localStorage.getItem('arijeem_drivers');
        if (stored) drivers = JSON.parse(stored);
    }
    populateDrivers();
}

async function loadRoutes() {
    try {
        const { data, error } = await db.from('routes').select('*').eq('active', true).order('name');
        if (!error && data && data.length > 0) {
            routes = data.map(r => r.name);
        } else {
            const stored = localStorage.getItem('arijeem_routes');
            if (stored) routes = JSON.parse(stored);
        }
    } catch (e) {
        const stored = localStorage.getItem('arijeem_routes');
        if (stored) routes = JSON.parse(stored);
    }
    populateRoutes();
}

function populateDrivers() {
    const select = document.getElementById('driver-select');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">SELECT DRIVER (OPTIONAL)</option>' +
        drivers.map(d => `<option value="${d}">${d}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

function populateRoutes() {
    const select = document.getElementById('route-select');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">SELECT ROUTE (OPTIONAL)</option>' +
        routes.map(r => `<option value="${r}">${r}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

function showAddDriverModal() {
    document.getElementById('add-driver-modal').classList.remove('hidden');
}

function closeAddDriverModal() {
    document.getElementById('add-driver-modal').classList.add('hidden');
}

async function handleAddDriver(e) {
    e.preventDefault();
    const nameInput = document.getElementById('driver-name');
    const name = nameInput.value.trim().toUpperCase();
    if (!name) return;

    if (!drivers.includes(name)) {
        drivers.push(name);
        localStorage.setItem('arijeem_drivers', JSON.stringify(drivers));
        try {
            await db.from('drivers').insert([{ name, active: true }]);
        } catch (err) {}
    }

    populateDrivers();
    document.getElementById('driver-select').value = name;
    document.getElementById('add-driver-form').reset();
    closeAddDriverModal();
}

function showAddRouteModal() {
    document.getElementById('add-route-modal').classList.remove('hidden');
}

function closeAddRouteModal() {
    document.getElementById('add-route-modal').classList.add('hidden');
}

async function handleAddRoute(e) {
    e.preventDefault();
    const nameInput = document.getElementById('route-name');
    const name = nameInput.value.trim().toUpperCase();
    if (!name) return;

    if (!routes.includes(name)) {
        routes.push(name);
        localStorage.setItem('arijeem_routes', JSON.stringify(routes));
        try {
            await db.from('routes').insert([{ name, active: true }]);
        } catch (err) {}
    }

    populateRoutes();
    document.getElementById('route-select').value = name;
    document.getElementById('add-route-form').reset();
    closeAddRouteModal();
}


