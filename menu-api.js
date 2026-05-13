// Example: Fetch and render menu items in Admin.html
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
    alert('Failed to load menu: ' + err.message);
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
    alert(data.message);
    fetchMenu(); // Refresh list
  } catch (err) {
    alert('Failed to add menu item: ' + err.message);
  }
}

// Call fetchMenu() on page load
if (window.location.pathname.endsWith('Admin.html')) {
  document.addEventListener('DOMContentLoaded', fetchMenu);
}
