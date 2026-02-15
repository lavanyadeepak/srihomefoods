    // --- Configuration ---
    let phoneNumber = ""; 
    let menuDate = "";
    
    // Flattened list for logic
    let menuItems = [];

    // State to track quantities
    let cart = {}; 

    // Initialize
    async function init() {
        const menuContainer = document.getElementById('menu-list');
        
        try {
            const response = await fetch('./assets/data/menu.json');
            if (!response.ok) throw new Error("Failed to load menu");
            const data = await response.json();

            phoneNumber = data.phoneNumber;
            menuDate = data.date;
            document.querySelector('.date-badge').innerText = `🗓️ Menu for: ${menuDate}`;
            menuContainer.innerHTML = ''; // Clear loading
            
            data.categories.forEach(category => {
                // Render Category Header
                const catHeader = document.createElement('div');
                catHeader.className = 'category-header';
                catHeader.innerText = category.title;
                menuContainer.appendChild(catHeader);

                category.items.forEach(item => {
                    menuItems.push(item); // Add to flat list
                    cart[item.id] = 0;
                    
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'menu-item';
                    itemDiv.innerHTML = `
                        <div class="item-header">
                            <div>
                                <div class="item-name">${item.name}</div>
                                <div class="item-desc">${item.desc}</div>
                            </div>
                            <div class="item-price">₹${item.price}</div>
                        </div>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                            <span class="qty-display" id="qty-${item.id}">0</span>
                            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        </div>
                    `;
                    menuContainer.appendChild(itemDiv);
                });
            });
        } catch (e) {
            console.error(e);
            menuContainer.innerHTML = '<div style="text-align:center; color:red;">Failed to load menu.</div>';
        }
    }

    // Update Quantity Logic
    function updateQty(id, change) {
        if (cart[id] + change >= 0) {
            cart[id] += change;
            document.getElementById(`qty-${id}`).innerText = cart[id];
            calculateTotal();
        }
    }

    // Calculate Total Price
    function calculateTotal() {
        let total = 0;
        let itemCount = 0;
        
        menuItems.forEach(item => {
            total += (cart[item.id] * item.price);
            itemCount += cart[item.id];
        });

        document.getElementById('grand-total').innerText = total;
        
        // Enable/Disable button based on selection
        const btn = document.getElementById('wa-button');
        if (itemCount > 0) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    }

    // Open Confirmation Modal
    function openModal() {
        const modal = document.getElementById('order-modal');
        const summaryDiv = document.getElementById('order-summary');
        
        let html = '';
        let total = 0;

        menuItems.forEach(item => {
            const qty = cart[item.id];
            if (qty > 0) {
                const itemTotal = qty * item.price;
                total += itemTotal;
                html += `
                    <div class="summary-item">
                        <span>${item.name} <small>(x${qty})</small></span>
                        <span>₹${itemTotal}</span>
                    </div>
                `;
            }
        });

        // Add Delivery/Pickup Options
        html += `
            <div class="delivery-options">
                <div style="font-weight:bold; margin-bottom:10px; color:var(--secondary);">Order Type:</div>
                <label class="option-label">
                    <input type="radio" name="orderType" value="pickup" checked onchange="updateOrderTotal(${total})">
                    <span>🥡 To-Go / Pickup (Bring carry bag)</span>
                </label>
                <label class="option-label">
                    <input type="radio" name="orderType" value="delivery" onchange="updateOrderTotal(${total})">
                    <span>🛵 Home Delivery (+₹30)</span>
                </label>
            </div>
        `;

        html += `
            <div class="summary-total">
                <span>Total Bill</span>
                <span id="modal-total-display">₹${total}</span>
            </div>
        `;

        summaryDiv.innerHTML = html;
        modal.style.display = 'flex';
    }

    // Update Total in Modal based on Selection
    function updateOrderTotal(subtotal) {
        const isDelivery = document.querySelector('input[name="orderType"]:checked').value === 'delivery';
        const finalTotal = isDelivery ? subtotal + 30 : subtotal;
        document.getElementById('modal-total-display').innerText = '₹' + finalTotal;
    }

    function closeModal() {
        document.getElementById('order-modal').style.display = 'none';
    }

    // Generate WhatsApp Link & Send
    function confirmOrder() {
        let message = `*New Order for ${menuDate}*\n------------------\n`;
        let total = 0;
        let hasItems = false;
        
        // Get Order Type
        const orderType = document.querySelector('input[name="orderType"]:checked').value;

        menuItems.forEach(item => {
            const qty = cart[item.id];
            if (qty > 0) {
                message += `${item.name} x ${qty} = ₹${qty * item.price}\n`;
                total += (qty * item.price);
                hasItems = true;
            }
        });

        if (!hasItems) return;

        if (orderType === 'delivery') {
            message += `Delivery Charge: ₹30\n`;
            total += 30;
        }

        message += `------------------\n*Total Bill: ₹${total}*\n`;
        message += `Type: ${orderType === 'delivery' ? 'Home Delivery 🛵' : 'Pickup 🥡'}\n\n`;
        
        message += `Please confirm availability and delivery time.`;

        // Encode the message for URL
        const encodedMsg = encodeURIComponent(message);
        const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;

        // Open WhatsApp
        window.open(waUrl, '_blank');
        closeModal();
    }

    // Run on load
    init();
