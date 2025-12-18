// DOM Elements
let imageBaseUrlInput, messageTemplateInput, deliveryDateInput;
let sourceFileRadio, sourceUrlRadio, fileInputContainer, urlInputContainer;
let csvFileInput, csvUrlInput;
let uploadForm;
let messagesContainer, historyContainer, historyList;
let settingsButton, columnMappingButton, clearHistoryButton, saveMappingBtn;
let settingsModal, columnMappingModal;
let closeModalButtons;
let generatedCountSpan, sentCountSpan;
let livePreviewBox, livePreviewContainer;
let productImageTable, newProductForm;
let columnMappingUi;
let dniSearchInput, dniSearchButton, dniSearchResult;

// App State
let appConfig = {
    imageBaseUrl: '',
    messageTemplate: `👋 ¡Hola *{nombre}*! (Cliente: {cod_cliente})

📦 Tu producto '{producto}' está listo para ser entregado.
{imagen_url}

El precio final es de *S/.{precio}*.

🚚 Un motorizado se estará acercando el día {fecha} a tu ubicación: {ubicacion}.

Nuestro horario de atención es de 7am a 6pm. ☀️
¡Gracias por tu compra! 😊`,
    productImageMap: {},
    columnMapping: {
        nombre: 'nombre',
        telefono: 'telefono',
        producto: 'producto',
        precio: 'precio',
        cod_cliente: 'cod_cliente',
        ubicacion: 'ubicacion'
    }
};
let csvData = {
    data: [],
    headers: []
};
const historyColors = ['#e8f5e9', '#e3f2fd', '#fffde7', '#fce4ec', '#f3e5f5', '#e8eaf6'];

// --- INITIALIZATION --- //
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    loadConfig();
    registerEventListeners();
    updateCounters();
    toggleDataSource();
    renderProductImageMap();
});

function initializeDOMElements() {
    // ... (same as before, just adding saveMappingBtn)
    imageBaseUrlInput = document.getElementById('image-base-url');
    messageTemplateInput = document.getElementById('message-template');
    deliveryDateInput = document.getElementById('delivery-date');
    csvFileInput = document.getElementById('csv-file');
    csvUrlInput = document.getElementById('csv-url');
    sourceFileRadio = document.getElementById('source-file');
    sourceUrlRadio = document.getElementById('source-url');
    fileInputContainer = document.getElementById('file-input-container');
    urlInputContainer = document.getElementById('url-input-container');
    uploadForm = document.getElementById('upload-form');
    messagesContainer = document.getElementById('messages-container');
    historyContainer = document.getElementById('history-container');
    historyList = document.getElementById('history-list');
    settingsButton = document.getElementById('settings-btn');
    columnMappingButton = document.getElementById('column-mapping-btn');
    clearHistoryButton = document.getElementById('clear-history-btn');
    saveMappingBtn = document.getElementById('save-mapping-btn');
    closeModalButtons = document.querySelectorAll('.close-button');
    settingsModal = document.getElementById('settings-modal');
    columnMappingModal = document.getElementById('column-mapping-modal');
    generatedCountSpan = document.getElementById('generated-count');
    sentCountSpan = document.getElementById('sent-count');
    livePreviewBox = document.getElementById('live-preview');
    livePreviewContainer = document.getElementById('live-preview-container');
    productImageTable = document.getElementById('product-image-table').querySelector('tbody');
    newProductForm = document.getElementById('new-product-form');
    columnMappingUi = document.getElementById('column-mapping-ui');
    dniSearchInput = document.getElementById('dni-search-input');
    dniSearchButton = document.getElementById('dni-search-button');
    dniSearchResult = document.getElementById('dni-search-result');
}

function registerEventListeners() {
    uploadForm.addEventListener('submit', handleFormSubmit);
    sourceFileRadio.addEventListener('change', toggleDataSource);
    sourceUrlRadio.addEventListener('change', toggleDataSource);
    messagesContainer.addEventListener('click', handleSendMessage);
    clearHistoryButton.addEventListener('click', clearHistory);

    imageBaseUrlInput.addEventListener('input', () => { saveConfig('imageBaseUrl', imageBaseUrlInput.value, false); updateLivePreview(); });
    messageTemplateInput.addEventListener('input', () => { saveConfig('messageTemplate', messageTemplateInput.value, false); updateLivePreview(); });
    deliveryDateInput.addEventListener('change', updateLivePreview);

    settingsButton.addEventListener('click', () => openModal(settingsModal));
    columnMappingButton.addEventListener('click', () => {
        if (csvData.headers.length > 0) {
            renderColumnMappingUI();
        } else {
            alert("Primero debes cargar un archivo CSV para poder mapear las columnas.");
        }
    });
    closeModalButtons.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) closeModal(settingsModal);
        if (event.target == columnMappingModal) closeModal(columnMappingModal);
    });

    newProductForm.addEventListener('submit', handleAddProduct);
    productImageTable.addEventListener('click', handleProductTableClick);
    saveMappingBtn.addEventListener('click', handleSaveMapping);
    dniSearchButton.addEventListener('click', handleDniSearch);
}

// --- DNI SEARCH --- //
function handleDniSearch() {
    const searchTerm = dniSearchInput.value.trim();
    if (!searchTerm) {
        dniSearchResult.innerHTML = '<span style="color: orange;">Por favor, introduce un DNI para buscar.</span>';
        return;
    }

    if (csvData.data.length === 0) {
        dniSearchResult.innerHTML = '<span style="color: red;">No hay datos CSV cargados. Por favor, sube un archivo primero.</span>';
        return;
    }

    const dniColumn = appConfig.columnMapping.cod_cliente;
    const nameColumn = appConfig.columnMapping.nombre;

    if (!dniColumn || !nameColumn) {
        dniSearchResult.innerHTML = '<span style="color: red;">El mapeo de columnas para DNI (cod_cliente) o nombre no está configurado.</span>';
        return;
    }
    
    const result = csvData.data.find(row => row[dniColumn] && row[dniColumn].trim() === searchTerm);

    if (result) {
        dniSearchResult.innerHTML = `<strong>Cliente Encontrado:</strong> ${result[nameColumn]}`;
    } else {
        dniSearchResult.innerHTML = `<span style="color: red;">No se encontró ningún cliente con el DNI: ${searchTerm}</span>`;
    }
}


// --- CONFIG & STATE MANAGEMENT --- //

function loadConfig() {
    const savedBaseUrl = localStorage.getItem('imageBaseUrl');
    if (savedBaseUrl) { imageBaseUrlInput.value = savedBaseUrl; }

    const savedTemplate = localStorage.getItem('messageTemplate');
    messageTemplateInput.value = savedTemplate || appConfig.messageTemplate;

    const savedProductMap = localStorage.getItem('productImageMap');
    if (savedProductMap) { appConfig.productImageMap = JSON.parse(savedProductMap); }
    
    const savedColumnMapping = localStorage.getItem('columnMapping');
    if (savedColumnMapping) { appConfig.columnMapping = JSON.parse(savedColumnMapping); }
}

function saveConfig(key, value, isObject = true) {
    appConfig[key] = value;
    const valueToStore = isObject ? JSON.stringify(value) : value;
    localStorage.setItem(key, valueToStore);
}

// --- MAIN LOGIC --- //

function handleFormSubmit(event) {
    event.preventDefault();
    messagesContainer.innerHTML = '';
    historyList.innerHTML = '';
    updateCounters();
    
    const deliveryDate = deliveryDateInput.value;
    if (!deliveryDate) { alert('Por favor, selecciona una fecha de entrega.'); return; }

    const dataSource = document.querySelector('input[name="source"]:checked').value;
    const config = { header: true, skipEmptyLines: true, complete: handleCsvParsed };
    if (dataSource === 'file') {
        const csvFile = csvFileInput.files[0];
        if (csvFile) { Papa.parse(csvFile, config); } else { alert('Por favor, selecciona un archivo CSV.'); }
    } else {
        const csvUrl = csvUrlInput.value;
        if (csvUrl) {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
            config.download = true;
            Papa.parse(proxyUrl, config);
        } else { alert('Por favor, introduce una URL válida.'); }
    }
}

function handleCsvParsed(results) {
    if (results.errors.length > 0) {
        alert("Error al leer datos del CSV: " + results.errors.map(e => e.message).join('\n'));
        csvData = { data: [], headers: [] };
    } else if (results.data.length === 0) {
        alert('No se encontraron filas en la fuente de datos.');
        csvData = { data: [], headers: [] };
    } else {
        csvData = { data: results.data, headers: results.meta.fields };
        alert('Datos CSV cargados y listos para buscar.');
        renderColumnMappingUI(); // Trigger mapping UI
    }
    updateLivePreview();
}

function processMessages() {
    messagesContainer.innerHTML = '';
    csvData.data.forEach((row) => {
        const message = generateMessage(row);
        const get = (key) => row[appConfig.columnMapping[key]] || '';
        
        const phone = get('telefono').replace(/\D/g, '');
        if(phone) { createMessageItem(get('nombre'), phone, get('cod_cliente'), message); }
    });
    updateCounters();
}

function generateMessage(row) {
    const get = (key) => row[appConfig.columnMapping[key]] || `[${key}]`;
    const productName = get('producto').toLowerCase();
    const imageFileName = appConfig.productImageMap[productName];
    let imageUrl = '';
    if (imageFileName && imageBaseUrlInput.value) {
        imageUrl = imageBaseUrlInput.value + imageFileName;
    }
    
    let message = messageTemplateInput.value;
    message = message.replace('{imagen_url}', imageUrl || '');
    message = message.replace('{fecha}', deliveryDateInput.value || '[Sin Fecha]');
    
    for (const key in appConfig.columnMapping) {
        const placeholder = `{${key}}`;
        message = message.split(placeholder).join(get(key));
    }
    return message;
}

function createMessageItem(name, phone, cod_cliente, message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    messageItem.dataset.name = name;
    messageItem.dataset.phone = phone;
    messageItem.dataset.codCliente = cod_cliente;
    const textElement = document.createElement('p');
    textElement.innerHTML = `<b>Para:</b> ${name} (${cod_cliente})<br><b>Mensaje:</b> ${message}`;
    const linkElement = document.createElement('a');
    linkElement.href = whatsappUrl;
    linkElement.textContent = 'Enviar';
    linkElement.className = 'send-button';
    linkElement.target = '_blank';
    messageItem.appendChild(textElement);
    messageItem.appendChild(linkElement);
    messagesContainer.appendChild(messageItem);
}

// ... (handleSendMessage remains the same)
function handleSendMessage(event) {
    if (event.target.classList.contains('send-button')) {
        event.preventDefault();
        const button = event.target;
        const messageItem = button.closest('.message-item');
        const { name, phone, codCliente } = messageItem.dataset;
        const historyIndex = historyList.children.length;
        const historyItem = document.createElement('li');
        historyItem.style.backgroundColor = historyColors[historyIndex % historyColors.length];
        historyItem.textContent = `✅ Enviado a: ${name} (${codCliente}) - ${phone}`;
        historyList.appendChild(historyItem);
        window.open(button.href, '_blank');
        messageItem.remove();
        updateCounters();
    }
}
// --- PRODUCT/IMAGE MAPPING --- //

function renderProductImageMap() {
    productImageTable.innerHTML = '';
    for (const product in appConfig.productImageMap) {
        const row = document.createElement('tr');
        row.dataset.product = product;
        row.innerHTML = `
            <td><input type="text" value="${product}" readonly></td>
            <td><input type="text" value="${appConfig.productImageMap[product]}"></td>
            <td><button class="button button-small button-danger delete-product-btn">Borrar</button></td>`;
        productImageTable.appendChild(row);
    }
}

function handleAddProduct(event) {
    event.preventDefault();
    const newNameInput = document.getElementById('new-product-name');
    const newFileInput = document.getElementById('new-image-filename');
    const newName = newNameInput.value.trim().toLowerCase();
    const newFile = newFileInput.value.trim();
    if (newName && newFile) {
        appConfig.productImageMap[newName] = newFile;
        saveConfig('productImageMap', appConfig.productImageMap);
        renderProductImageMap();
        newNameInput.value = '';
        newFileInput.value = '';
    }
}

function handleProductTableClick(event) {
    const target = event.target;
    if (target.classList.contains('delete-product-btn')) {
        const row = target.closest('tr');
        const productKey = row.dataset.product;
        if (confirm(`¿Estás seguro de que quieres borrar el producto "${productKey}"?`)) {
            delete appConfig.productImageMap[productKey];
            saveConfig('productImageMap', appConfig.productImageMap);
            renderProductImageMap();
        }
    }
}

// --- COLUMN MAPPING --- //

function renderColumnMappingUI() {
    columnMappingUi.innerHTML = '';
    const requiredFields = {
        nombre: 'Nombre Cliente',
        telefono: 'Teléfono',
        producto: 'Producto',
        precio: 'Precio',
        cod_cliente: 'Código Cliente',
        ubicacion: 'Ubicación'
    };

    for (const field in requiredFields) {
        const row = document.createElement('div');
        row.className = 'form-group';
        const label = document.createElement('label');
        label.textContent = requiredFields[field];
        label.htmlFor = `map-${field}`;

        const select = document.createElement('select');
        select.id = `map-${field}`;
        select.dataset.field = field;

        const csvHeaders = ['[No Usar]', ...csvData.headers];
        csvHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            if ((appConfig.columnMapping[field] || field).toLowerCase() === header.toLowerCase()) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        row.appendChild(label);
        row.appendChild(select);
        columnMappingUi.appendChild(row);
    }
    openModal(columnMappingModal);
}

function handleSaveMapping() {
    const selects = columnMappingUi.querySelectorAll('select');
    const newMapping = {};
    selects.forEach(select => {
        const field = select.dataset.field;
        newMapping[field] = select.value === '[No Usar]' ? null : select.value;
    });
    saveConfig('columnMapping', newMapping);
    closeModal(columnMappingModal);
    processMessages(); // Re-process messages with new mapping
    updateLivePreview();
}

// --- UI & UTILITY --- //
function toggleDataSource() {
    urlInputContainer.style.display = sourceUrlRadio.checked ? 'block' : 'none';
    fileInputContainer.style.display = sourceFileRadio.checked ? 'block' : 'none';
}
function updateCounters() {
    generatedCountSpan.textContent = messagesContainer.getElementsByClassName('message-item').length;
    sentCountSpan.textContent = historyList.children.length;
}
function clearHistory() {
    historyList.innerHTML = '';
    updateCounters();
}
function updateLivePreview() {
    if (csvData.data.length === 0) {
        livePreviewContainer.style.display = 'none';
        return;
    }
    livePreviewContainer.style.display = 'block';
    livePreviewBox.innerText = generateMessage(csvData.data[0]);
}
function openModal(modal) { modal.style.display = 'block'; }
function closeModal(modal) { modal.style.display = 'none'; }
