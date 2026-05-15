// Example: Fetch and render menu items in Admin.html
function showPopup(options) {
  if (typeof Swal !== 'undefined') {
    return Swal.fire(options);
  }
  console.warn('SweetAlert2 is not loaded. Popup message:', options.text || options.title || 'Notification');
  return Promise.resolve();
}

async function fetchMenu() {
  try {
    const res = await fetch('http://localhost:5000/api/menu');
    const menu = await res.json();
    // Render menu items in your admin dashboard
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    menu.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ₱${item.price}`;
      menuList.appendChild(li);
    });
  } catch (err) {
    await showPopup({
      icon: 'error',
      title: 'Failed to load menu',
      text: err.message
    });
  }
}

// Example: Add a new menu item
async function addMenuItem(name, description, price) {
  try {
    const res = await fetch('http://localhost:5000/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, price })
    });
    const data = await res.json();
    await showPopup({
      icon: res.ok ? 'success' : 'error',
      title: res.ok ? 'Success' : 'Request failed',
      text: data.message || 'No message returned from server'
    });
    fetchMenu(); // Refresh list
  } catch (err) {
    await showPopup({
      icon: 'error',
      title: 'Failed to add menu item',
      text: err.message
    });
  }
}

// Call fetchMenu() on page load
if (window.location.pathname.endsWith('Admin.html')) {
  document.addEventListener('DOMContentLoaded', fetchMenu);
}
