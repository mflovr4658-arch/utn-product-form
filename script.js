const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxEWHRDtzur0r4jgNQGXC6jRRGn3c4RmQqPitJFPK4Ex0LXxZujpZq545l8WurQPP4PZw/exec';

// ========================================
// 1. เชื่อมต่อ HTML Elements
// ========================================

const form = document.getElementById('productForm');
const fullNameInput = document.getElementById('fullName');
const departmentInput = document.getElementById('department');
const productInput = document.getElementById('productName');
const targetCustomerInput = document.getElementById('targetCustomer');
const usageInput = document.getElementById('usageDetails');
const submitBtn = document.getElementById('submitBtn');
const statusBox = document.getElementById('status');

let isSubmitting = false;

// ตรวจสอบว่า HTML มี Element ครบหรือไม่
if (
  !form ||
  !fullNameInput ||
  !departmentInput ||
  !productInput ||
  !targetCustomerInput ||
  !usageInput ||
  !submitBtn ||
  !statusBox
) {
  console.error('ไม่พบ HTML Element ที่จำเป็น กรุณาตรวจสอบ ID ใน index.html');
  throw new Error('Form elements not found');
}

// ========================================
// 2. แสดงสถานะ
// ========================================

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = 'status ' + type;
  statusBox.style.display = 'block';
}

function hideStatus() {
  statusBox.textContent = '';
  statusBox.className = 'status';
  statusBox.style.display = 'none';
}

// ========================================
// 3. ส่งข้อมูลไป Google Apps Script
// ========================================

function sendRequest(params) {
  return new Promise((resolve, reject) => {
    const callbackName =
      'productCallback_' +
      Date.now() +
      '_' +
      Math.floor(Math.random() * 1000000);

    const script = document.createElement('script');
    let completed = false;
    let timeout;

    function cleanup() {
      clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    function finish(callback, value) {
      if (completed) return;

      completed = true;
      cleanup();
      callback(value);
    }

    window[callbackName] = function (response) {
      finish(resolve, response);
    };

    const query = new URLSearchParams({
      ...params,
      callback: callbackName,
    });

    script.src = SCRIPT_URL + '?' + query.toString();

    script.onerror = function () {
      finish(reject, new Error('เชื่อมต่อ Google Apps Script ไม่สำเร็จ'));
    };

    timeout = setTimeout(() => {
      finish(reject, new Error('หมดเวลารอการตอบกลับจากระบบ'));
    }, 25000);

    document.body.appendChild(script);
  });
}

// ========================================
// 4. ส่งแบบฟอร์ม
// ========================================

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  if (isSubmitting) return;

  hideStatus();

  const data = {
    fullName: fullNameInput.value.trim(),
    department: departmentInput.value,
    productName: productInput.value.trim(),
    targetCustomer: targetCustomerInput.value.trim(),
    usageDetails: usageInput.value.trim(),
  };

  // ตรวจสอบข้อมูล
  if (
    !data.fullName ||
    !data.department ||
    !data.productName ||
    !data.targetCustomer ||
    !data.usageDetails
  ) {
    showStatus('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
    return;
  }

  if (data.productName.length > 200) {
    showStatus('ชื่อสินค้าต้องไม่เกิน 200 ตัวอักษร', 'error');
    productInput.focus();
    return;
  }

  // ป้องกันการกดส่งซ้ำ
  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังส่งข้อมูล...';

  try {
    const result = await sendRequest({
      action: 'submit',
      fullName: data.fullName,
      department: data.department,
      productName: data.productName,
      targetCustomer: data.targetCustomer,
      usageDetails: data.usageDetails,
    });

    if (!result || typeof result !== 'object') {
      throw new Error('ข้อมูลตอบกลับจากระบบไม่ถูกต้อง');
    }

    // กรณีชื่อสินค้าซ้ำ
    if (result.duplicate === true) {
      showStatus('ชื่อสินค้านี้มีอยู่แล้ว กรุณากรอกชื่อสินค้าใหม่', 'warning');

      productInput.focus();
      productInput.select();
    }

    // กรณีบันทึกสำเร็จ
    else if (result.success === true) {
      showStatus('ส่งข้อมูลสำเร็จ!', 'success');
      form.reset();
    }

    // กรณีระบบตอบกลับว่าไม่สำเร็จ
    else {
      showStatus(result.message || 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  } catch (error) {
    console.error('Submit Error:', error);

    showStatus('เกิดข้อผิดพลาด: ' + error.message, 'error');
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'ส่งข้อมูล';
  }
});

// ========================================
// 5. ล้างข้อความแจ้งเตือนเมื่อแก้ไขข้อมูล
// ========================================

form.addEventListener('input', function () {
  if (!isSubmitting) hideStatus();
});

form.addEventListener('change', function () {
  if (!isSubmitting) hideStatus();
});

// ========================================
// 6. ตรวจสอบการโหลด JavaScript
// ========================================

console.log('UTN Product Form Loaded Successfully');
