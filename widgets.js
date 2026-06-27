
// ─── GLOBAL SESSION GUARD ───
(function enforceSessionGuard() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);

  // List of pages that guests/unregistered users are allowed to access
  const PUBLIC_PAGES = ['Index.html', '', 'index.html', 'library.html', 'read.html', 'auth.html'];
  const isPublic = PUBLIC_PAGES.some(p => page.toLowerCase() === p.toLowerCase());
  
  if (!isPublic) {
    const token = localStorage.getItem('sn_auth_token');
    if (!token) {
      window.location.href = 'auth.html';
    }
  }
})();

// ─── WIDGETS ENGINE: NOTIFICATION CENTER & FLOATING SHOP ───

const WIDGET_DEFAULT_NOTIFS = [
  {id: 1, text: "👤 Daoist_Cody replied to your comment on Chapter 47.", time: "10 mins ago"},
  {id: 2, text: "🎁 You received a Spirit Stone gift (50 SC) for your novel.", time: "2 hours ago"},
  {id: 3, text: "🛡️ Heavenly Scribe Sect completed a Guild Quest! +100 SC reward.", time: "5 hours ago"}
];

// Initialize Notifications Store
if(!localStorage.getItem('sn_notifications')){
  localStorage.setItem('sn_notifications', JSON.stringify(WIDGET_DEFAULT_NOTIFS));
}

// Sync session coins with backend if logged in
(async function syncCoinsWithBackend() {
  const token = localStorage.getItem('sn_auth_token');
  if (token) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.error && data.user) {
        localStorage.setItem('sn_user', JSON.stringify(data.user));
        localStorage.setItem('sn_user_coins', data.user.coinsBalance);
        // Update coin text globally across page elements if present
        const coinVal = data.user.coinsBalance;
        const coinsText = document.getElementById('coinBalance') || document.getElementById('exchangeBalance');
        if(coinsText) coinsText.textContent = coinVal.toLocaleString();
        const profileCoins = document.querySelector('.coin-balance');
        if(profileCoins) profileCoins.textContent = '⚡ ' + coinVal.toLocaleString();
        const heroCoins = document.getElementById('heroCoinsDisplay');
        if(heroCoins) heroCoins.innerHTML = `&#9889; ${coinVal.toLocaleString()}`;
        const statsCoins = document.getElementById('statsCoinsDisplay');
        if(statsCoins) statsCoins.innerHTML = `&#9889; ${coinVal.toLocaleString()}`;
      }
    } catch(e) {
      console.log("Backend offline or unreachable, using local storage mock values.");
    }
  }
})();

// Global coins setup helper
function getCoinsBalance() {
  return parseInt(localStorage.getItem('sn_user_coins') || '48200');
}
function setCoinsBalance(val) {
  localStorage.setItem('sn_user_coins', val);
  // Update coin text globally across page elements if present
  const coinsText = document.getElementById('coinBalance') || document.getElementById('exchangeBalance');
  if(coinsText) coinsText.textContent = val.toLocaleString();
  const profileCoins = document.querySelector('.coin-balance');
  if(profileCoins) profileCoins.textContent = '⚡ ' + val.toLocaleString();
}

// Injects the unified navbar
function injectNavbar() {
  const topbar = document.querySelector('header.topbar') || document.querySelector('.topbar') || document.querySelector('.header');
  if (!topbar) return;

  // Check if nav-menu already exists
  let navMenu = topbar.querySelector('.nav-menu');
  if (!navMenu) {
    navMenu = document.createElement('ul');
    navMenu.className = 'nav-menu';
    
    // Find where to insert it. Insert before topbar-right if exists, or append it
    const right = topbar.querySelector('.topbar-right') || topbar.querySelector('.nav-actions') || topbar.querySelector('.nav-right');
    if (right) {
      topbar.insertBefore(navMenu, right);
    } else {
      topbar.appendChild(navMenu);
    }
  }

  // Populate nav links (clear old links to unify)
  navMenu.innerHTML = `
    <li><a href="Index.html" class="nav-link" id="navLinkHome">Home</a></li>
    <li><a href="library.html" class="nav-link" id="navLinkLibrary">Library</a></li>
    <li><a href="writer-hall.html" class="nav-link" id="navLinkWriter">Writer Hall</a></li>
    <li><a href="tower.html" class="nav-link" id="navLinkTower">Tower of Honor</a></li>
    <li><a href="community.html" class="nav-link" id="navLinkCommunity">Community Hall</a></li>
    <li><a href="exchange.html" class="nav-link" id="navLinkExchange">Exchange Coins</a></li>
    <li><a href="multimedia.html" class="nav-link" id="navLinkMedia">E-Reader & Audio</a></li>
    <li><a href="profile.html" class="nav-link" id="navLinkProfile">Profile</a></li>
  `;

  // Highlight active link based on current path
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);

  if (page === 'Index.html' || page === '') {
    const el = document.getElementById('navLinkHome');
    if(el) el.classList.add('active');
  } else if (page.includes('library.html')) {
    const el = document.getElementById('navLinkLibrary');
    if(el) el.classList.add('active');
  } else if (page.includes('writer-hall.html') || page.includes('editor.html')) {
    const el = document.getElementById('navLinkWriter');
    if(el) el.classList.add('active');
  } else if (page.includes('tower.html')) {
    const el = document.getElementById('navLinkTower');
    if(el) el.classList.add('active');
  } else if (page.includes('community.html')) {
    const el = document.getElementById('navLinkCommunity');
    if(el) el.classList.add('active');
  } else if (page.includes('exchange.html')) {
    const el = document.getElementById('navLinkExchange');
    if(el) el.classList.add('active');
  } else if (page.includes('multimedia.html')) {
    const el = document.getElementById('navLinkMedia');
    if(el) el.classList.add('active');
  } else if (page.includes('profile.html')) {
    const el = document.getElementById('navLinkProfile');
    if(el) el.classList.add('active');
  }
}

// Injects the Bell notification button dynamically into the DOM
function injectWidgets() {
  // 1. Inject Navbar first to unify navigation structure
  injectNavbar();

  // 2. Inject Floating SC Recharge Button
  const floatBtn = document.createElement('div');
  floatBtn.className = 'floating-buy-sc';
  floatBtn.innerHTML = `<span class="coin-icon">⚡</span><span>Buy Coins</span>`;
  floatBtn.onclick = openRechargeShop;
  document.body.appendChild(floatBtn);

  // 3. Inject Shop Modal
  const shopOverlay = document.createElement('div');
  shopOverlay.className = 'shop-modal-overlay';
  shopOverlay.id = 'rechargeShopModal';
  shopOverlay.onclick = (e) => { if(e.target === shopOverlay) closeRechargeShop(); };
  
  shopOverlay.innerHTML = `
    <div class="shop-modal" id="shopModalContent">
      <div id="shopPackagesView">
        <h3>Academy Coin Vault</h3>
        <p>Purchase Spirit Coins to read premium chapters, gift writers, or expand your writing guilds. Funds are split directly with authors.</p>
        <div class="shop-grid">
          <div class="shop-card" onclick="startCheckout(135, 75, 'Beginner Pack')">
            <div class="shop-card-coins">⚡ 135 SC</div>
            <div class="shop-card-price">₹75</div>
            <span class="shop-card-level">Beginner Rate</span>
          </div>
          <div class="shop-card" onclick="startCheckout(270, 150, 'Apprentice Pack')">
            <div class="shop-card-coins">⚡ 270 SC</div>
            <div class="shop-card-price">₹150</div>
            <span class="shop-card-level">Apprentice Rate</span>
          </div>
          <div class="shop-card" onclick="startCheckout(900, 500, 'Scholar Pack')">
            <div class="shop-card-coins">⚡ 900 SC</div>
            <div class="shop-card-price">₹500</div>
            <span class="shop-card-level">Scholar Rate</span>
          </div>
          <div class="shop-card" onclick="startCheckout(1800, 1000, 'Celestial Pack')">
            <div class="shop-card-coins">⚡ 1,800 SC</div>
            <div class="shop-card-price">₹1,000</div>
            <span class="shop-card-level">Master Rate</span>
          </div>
        </div>
        <div style="display:flex; justify-content:center; gap: 0.5rem;">
          <a href="exchange.html" class="btn btn-gold" style="padding: 6px 14px; font-size:0.8rem; text-decoration:none;">Custom Amount</a>
          <button class="btn btn-ghost" onclick="closeRechargeShop()" style="padding: 6px 16px; font-size:0.8rem;">✕ Close</button>
        </div>
      </div>
      
      <!-- Checkout View -->
      <div class="checkout-view" id="shopCheckoutView">
        <h3>Simulated Payment</h3>
        <div class="checkout-box">
          <div class="checkout-title" id="checkoutPackName">Scholar Pack</div>
          <div class="checkout-amt" id="checkoutPriceLabel">₹500</div>
          <div style="font-size:0.75rem; color:#4caf50; margin-top:0.4rem; font-weight:600;" id="checkoutCoinsLabel">⚡ 900 Spirit Coins</div>
        </div>
        <p style="font-size:0.72rem;">Proceeding initiates a safe academy transaction simulated for this portfolio presentation. No real billing occurs.</p>
        <div style="display:flex; gap:0.6rem; justify-content:flex-end;">
          <button class="btn btn-ghost" onclick="cancelCheckout()">Cancel</button>
          <button class="btn btn-gold" onclick="confirmPayment()" style="background:#4caf50; color:#fff;">Pay Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(shopOverlay);

  // 4. Inject Bell Notification Button into header topbar
  const headerRight = document.querySelector('.topbar-right') || document.querySelector('.nav-actions') || document.querySelector('.nav-container');
  if (headerRight) {
    const bellContainer = document.createElement('div');
    bellContainer.className = 'notif-bell-container';
    bellContainer.innerHTML = `
      <button class="notif-bell-btn" onclick="toggleNotificationsDropdown(event)" id="notifBellBtn">
        🔔<span class="notif-badge" id="notifBadge">0</span>
      </button>
      <div class="notif-dropdown" id="notifDropdown" onclick="event.stopPropagation()">
        <div class="notif-dropdown-hdr">
          <h4>Notifications</h4>
          <button class="notif-clear-btn" onclick="clearNotifications()">Clear All</button>
        </div>
        <div class="notif-dropdown-list" id="notifListContainer">
          <!-- Loaded dynamically -->
        </div>
      </div>
    `;
    
    // Inject at the beginning of topbar actions
    headerRight.insertBefore(bellContainer, headerRight.firstChild);
    updateNotificationBadge();
  }
}

/* ─── NOTIFICATION FUNCTIONS ─── */
function toggleNotificationsDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('notifDropdown');
  if(!dropdown) return;
  dropdown.classList.toggle('open');
  
  if (dropdown.classList.contains('open')) {
    renderNotificationList();
    // Mark notifications as read visually (hide badge number)
    document.getElementById('notifBadge').style.display = 'none';
  }
}

function updateNotificationBadge() {
  const notifs = JSON.parse(localStorage.getItem('sn_notifications') || '[]');
  const badge = document.getElementById('notifBadge');
  if (badge) {
    if (notifs.length > 0) {
      badge.textContent = notifs.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderNotificationList() {
  const container = document.getElementById('notifListContainer');
  if(!container) return;
  const notifs = JSON.parse(localStorage.getItem('sn_notifications') || '[]');
  
  if (notifs.length === 0) {
    container.innerHTML = `<div style="padding:2rem; text-align:center; color:#a59c94; font-size:0.75rem;">No new notifications.</div>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div class="notif-item">
      <div>${n.text}</div>
      <div class="notif-item-time">${n.time || 'Just now'}</div>
    </div>
  `).join('');
}

function clearNotifications() {
  localStorage.setItem('sn_notifications', JSON.stringify([]));
  updateNotificationBadge();
  renderNotificationList();
}

function addNotification(text) {
  const notifs = JSON.parse(localStorage.getItem('sn_notifications') || '[]');
  notifs.unshift({id: Date.now(), text, time: "Just now"});
  localStorage.setItem('sn_notifications', JSON.stringify(notifs));
  updateNotificationBadge();
}

/* ─── RECHARGE SHOP FUNCTIONS ─── */
function openRechargeShop() {
  const token = localStorage.getItem('sn_auth_token');
  if (!token) {
    // Redirect unregistered users to account creation portal
    window.location.href = 'auth.html?mode=register';
    return;
  }
  document.getElementById('shopCheckoutView').style.display = 'none';
  document.getElementById('shopPackagesView').style.display = 'block';
  document.getElementById('rechargeShopModal').classList.add('open');
}
function closeRechargeShop() {
  document.getElementById('rechargeShopModal').classList.remove('open');
}

let pendingCoins = 0;
let pendingPrice = 0;
let pendingPack = '';

function startCheckout(coins, price, packName) {
  pendingCoins = coins;
  pendingPrice = price;
  pendingPack = packName;

  document.getElementById('checkoutPackName').textContent = packName;
  document.getElementById('checkoutPriceLabel').textContent = '₹' + price.toLocaleString('en-IN');
  document.getElementById('checkoutCoinsLabel').textContent = '⚡ ' + coins.toLocaleString() + ' Spirit Coins';

  document.getElementById('shopPackagesView').style.display = 'none';
  document.getElementById('shopCheckoutView').style.display = 'flex';
}

// Global hook for outside pages to update balance dynamically
window.setCoinsBalance = setCoinsBalance;
window.addNotification = addNotification;

function cancelCheckout() {
  document.getElementById('shopCheckoutView').style.display = 'none';
  document.getElementById('shopPackagesView').style.display = 'block';
}

function confirmPayment() {
  // Update coins
  let cur = getCoinsBalance();
  cur += pendingCoins;
  setCoinsBalance(cur);

  // Push notification
  addNotification(`⚡ Purchased ${pendingPack}! +${pendingCoins} Spirit Coins added.`);

  closeRechargeShop();
  
  // Show toast
  showWidgetToast('⚡', `Recharge successful! +${pendingCoins} Spirit Coins added.`);
}

function showWidgetToast(ico, msg) {
  const t = document.getElementById('toast') || document.getElementById('toastWidget');
  if (t) {
    const tIco = document.getElementById('tIco') || document.getElementById('toastIcon');
    const tMsg = document.getElementById('tMsg') || document.getElementById('toastMsg');
    if (tIco) tIco.innerHTML = ico;
    if (tMsg) tMsg.innerHTML = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  } else {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(),500); }, 3000);
  }
}

// Click outside notification panel closes dropdown
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notifDropdown');
  if(dropdown && dropdown.classList.contains('open')) {
    if(!e.target.closest('.notif-bell-container') && !e.target.closest('#notifBellBtn')) {
      dropdown.classList.remove('open');
    }
  }
});

// Auto-run injection when page completes loading
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectWidgets, 100);
});
