import LogiChain from './blockchain.js';

const logiSystem = new LogiChain();

const loading = document.getElementById('loading');
const assetList = document.getElementById('assetList');
const blockExplorer = document.getElementById('blockExplorer');
const timeline = document.getElementById('timeline');

async function init() {
    await logiSystem.init();
    renderAll();
    lucide.createIcons();
}

window.registerProduct = async function() {
    const name = document.getElementById('itemName').value;
    const manufacturer = document.getElementById('manufacturer').value;
    const location = document.getElementById('initLocation').value;

    if (!name || !manufacturer || !location) {
        alert("Iltimos, barcha ma'lumotlarni to'ldiring!");
        return;
    }

    const assetId = `ASSET-${Date.now().toString().slice(-6)}`;
    
    loading.style.display = 'flex';
    
    // Simulate mining delay
    setTimeout(async () => {
        await logiSystem.addLogisticsEvent(
            assetId, 
            'INITIAL_REGISTRATION', 
            location, 
            manufacturer, 
            `${name} mahsuloti muvaffaqiyatli ro'yxatdan o'tkazildi.`
        );
        loading.style.display = 'none';
        
        document.getElementById('itemName').value = '';
        document.getElementById('manufacturer').value = '';
        document.getElementById('initLocation').value = '';

        renderAll();
        alert(`Mahsulot ro'yxatga olindi! ID: ${assetId}`);
    }, 100);
};

window.updateStatus = async function() {
    const assetId = document.getElementById('trackAssetId').value;
    const status = document.getElementById('newStatus').value;
    const location = document.getElementById('newLocation').value;
    const owner = document.getElementById('newOwner').value;
    const remarks = document.getElementById('remarks').value;

    if (!assetId || !location || !owner) {
        alert("Iltimos, ID, manzil va mas'ul shaxsni to'ldiring!");
        return;
    }

    // Check if asset exists
    const history = logiSystem.getAssetHistory(assetId);
    if (history.length === 0) {
        alert("Mahsulot topilmadi!");
        return;
    }

    loading.style.display = 'flex';

    setTimeout(async () => {
        await logiSystem.addLogisticsEvent(assetId, status, location, owner, remarks);
        loading.style.display = 'none';
        
        document.getElementById('newLocation').value = '';
        document.getElementById('newOwner').value = '';
        document.getElementById('remarks').value = '';

        renderAll();
        renderTimeline(assetId);
        alert("Blockchain muvaffaqiyatli yangilandi!");
    }, 100);
};

window.checkAuthenticity = function() {
    const assetId = document.getElementById('trackAssetId').value;
    if (!assetId) {
        alert("Iltimos, Mahsulot ID-sini kiriting!");
        return;
    }

    const isAuthentic = logiSystem.isAssetAuthentic(assetId);
    const timelineElement = document.getElementById('timeline');
    
    if (isAuthentic) {
        const history = logiSystem.getAssetHistory(assetId);
        if (history.length > 0) {
            alert("✅ TASDIQLANDI: Ushbu mahsulot blockchain tarmog'ida mavjud va ma'lumotlar o'zgartirilmagan.");
        } else {
            alert("❌ TOPILMADI: Bunday ID bilan mahsulot mavjud emas.");
        }
    } else {
        alert("⚠️ OGOHLANTIRISH: Blockchain yaxlitligi buzilgan yoki mahsulot soxta bo'lishi mumkin!");
    }
};

window.auditChain = function() {
    const isValid = logiSystem.validate();
    if (isValid) {
        alert("✅ AUDIT MUVAFFARIYATLI: Butun ta'minot zanjiri bazasi yaxlit holatda. Barcha hashlar mos keladi.");
    } else {
        alert("⚠️ ALERTA: Bazadagi ma'lumotlar manipulatsiya qilingan! Zanjir uzilgan.");
    }
};

function renderAll() {
    renderAssets();
    renderExplorer();
    lucide.createIcons();
}

function renderAssets() {
    assetList.innerHTML = '';
    
    // Get unique assets from chain
    const assets = {};
    logiSystem.chain.forEach(block => {
        if (block.index > 0 && block.data.assetId) {
            assets[block.data.assetId] = block.data;
        }
    });

    Object.keys(assets).forEach(id => {
        const data = assets[id];
        const div = document.createElement('div');
        div.className = 'asset-card';
        div.onclick = () => {
            document.getElementById('trackAssetId').value = id;
            window.showTab('tracking');
            renderTimeline(id);
        };
        
        div.innerHTML = `
            <div>
                <div style="font-weight: 800; color: var(--emerald)">${id}</div>
                <div style="font-size: 0.8rem; color: var(--text-gray)">Egasi: ${data.owner}</div>
            </div>
            <div class="badge status-reg">${data.location.split(',')[0]}</div>
        `;
        assetList.appendChild(div);
    });
}

function renderTimeline(assetId) {
    timeline.innerHTML = '';
    const history = logiSystem.getAssetHistory(assetId);
    
    if (history.length === 0) {
        timeline.innerHTML = '<p>Ma\'lumotlar topilmadi.</p>';
        return;
    }

    history.reverse().forEach(block => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        let statusClass = 'status-reg';
        if (block.data.eventType === 'IN_TRANSIT') statusClass = 'status-transit';
        if (block.data.eventType === 'DELIVERED') statusClass = 'status-done';

        item.innerHTML = `
            <div class="time-box">
                <div class="time-header">
                    <span class="badge ${statusClass}">${block.data.eventType}</span>
                    <span>${new Date(block.timestamp).toLocaleString()}</span>
                </div>
                <div class="time-loc"><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${block.data.location}</div>
                <div style="font-size: 0.85rem; margin-bottom: 5px;"><strong>Mas'ul:</strong> ${block.data.owner}</div>
                <div class="time-remark">${block.data.remarks}</div>
                <div style="font-size: 0.6rem; color: var(--text-gray); font-family: monospace; margin-top: 10px; word-break: break-all;">
                    Hash: ${block.hash}
                </div>
            </div>
        `;
        timeline.appendChild(item);
    });

    const auditDiv = document.createElement('div');
    auditDiv.style.marginTop = '20px';
    auditDiv.innerHTML = `
        <button class="btn btn-outline" onclick="checkAuthenticity()" style="margin-right: 10px;">
            <i data-lucide="shield-check"></i> Haqiqiylikni Tekshirish
        </button>
    `;
    timeline.appendChild(auditDiv);

    lucide.createIcons();
}

function renderExplorer() {
    blockExplorer.innerHTML = '';
    logiSystem.chain.forEach(block => {
        const div = document.createElement('div');
        div.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border-left: 4px solid var(--emerald)";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <span style="font-weight: 800; color: var(--emerald)">Blok #${block.index}</span>
                <span style="font-size: 0.8rem; color: var(--text-gray)">${block.timestamp}</span>
            </div>
            <div style="font-family: 'JetBrains Mono'; font-size: 0.75rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; color: var(--accent); word-break: break-all;">
                <strong>Hash:</strong> ${block.hash}<br>
                <strong>Prev Hash:</strong> ${block.previousHash}<br>
                <strong>Nonce:</strong> ${block.nonce}
            </div>
            <div style="margin-top: 1rem; font-size: 0.9rem;">
                <strong>Data Bind:</strong> ${JSON.stringify(block.data)}
            </div>
        `;
        blockExplorer.appendChild(div);
    });
}

init();
