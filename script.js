
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEWHRDtzur0r4jgNQGXC6jRRGn3c4RmQqPitJFPK4Ex0LXxZujpZq545l8WurQPP4PZw/exec";

// ==================================================
// 1. ELEMENTS
// ==================================================

// Page Navigation
const welcomePage = document.getElementById("welcomePage");
const formPage = document.getElementById("formPage");
const enterFormBtn = document.getElementById("enterFormBtn");

// Form Elements
const form = document.getElementById("productForm");

const employeeIDInput = document.getElementById("employeeID");
const fullNameInput = document.getElementById("fullName");
const departmentInput = document.getElementById("department");
const productInput = document.getElementById("productName");
const targetCustomerInput = document.getElementById("targetCustomer");
const usageInput = document.getElementById("usageDetails");

const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");

// Popup Elements
const statusBox = document.getElementById("status");
const popupIcon = document.getElementById("popupIcon");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const popupClose = document.getElementById("popupClose");

// Error Elements
const employeeIDError = document.getElementById("employeeIDError");
const fullNameError = document.getElementById("fullNameError");
const productNameError = document.getElementById("productNameError");

let previousFocus = null;

// สถานะยืนยันตัวตนพนักงาน
let employeeVerified = false;

// ป้องกันผลค้นหาเก่ามาทับผลค้นหาใหม่
let employeeLookupSequence = 0;


// ==================================================
// 2. PAGE NAVIGATION
// ==================================================

enterFormBtn.addEventListener("click", function () {

  welcomePage.hidden = true;
  formPage.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

});


// ==================================================
// 3. POPUP
// ==================================================

function showPopup(message, type = "success") {

  previousFocus = document.activeElement;

  statusBox.classList.remove("success", "error");
  statusBox.classList.add(type);

  if (type === "success") {
    popupIcon.textContent = "✓";
    popupTitle.textContent = "ส่งข้อมูลสำเร็จ!";
  } else {
    popupIcon.textContent = "!";
    popupTitle.textContent = "เกิดข้อผิดพลาด";
  }

  popupMessage.textContent = message;

  statusBox.hidden = false;
  statusBox.setAttribute("aria-hidden", "false");

  popupClose.focus();

}

function hidePopup() {

  statusBox.hidden = true;
  statusBox.setAttribute("aria-hidden", "true");

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }

}

popupClose.addEventListener("click", hidePopup);

statusBox.addEventListener("click", function (event) {

  if (event.target === statusBox) {
    hidePopup();
  }

});

document.addEventListener("keydown", function (event) {

  if (event.key === "Escape" && !statusBox.hidden) {
    hidePopup();
  }

});


// ==================================================
// 4. EMPLOYEE ERROR
// ==================================================

function showEmployeeIDError(message) {

  employeeIDInput.classList.add("input-error");
  employeeIDInput.setAttribute("aria-invalid", "true");

  employeeIDError.textContent = message;
  employeeIDError.hidden = false;

}

function clearEmployeeIDError() {

  employeeIDInput.classList.remove("input-error");
  employeeIDInput.removeAttribute("aria-invalid");

  employeeIDError.textContent = "";
  employeeIDError.hidden = true;

}

function showFullNameError(message) {

  fullNameInput.classList.add("input-error");
  fullNameInput.setAttribute("aria-invalid", "true");

  fullNameError.textContent = message;
  fullNameError.hidden = false;

}

function clearFullNameError() {

  fullNameInput.classList.remove("input-error");
  fullNameInput.removeAttribute("aria-invalid");

  fullNameError.textContent = "";
  fullNameError.hidden = true;

}


// ==================================================
// 5. DUPLICATE PRODUCT ERROR
// ==================================================

function showProductError(message) {

  productInput.classList.add("input-error");
  productInput.setAttribute("aria-invalid", "true");

  productNameError.textContent = message;
  productNameError.hidden = false;

}

function clearProductError() {

  productInput.classList.remove("input-error");
  productInput.removeAttribute("aria-invalid");

  productNameError.textContent = "";
  productNameError.hidden = true;

}


// ==================================================
// 6. CLEAR ALL ERRORS
// ==================================================

function clearAllErrors() {

  clearEmployeeIDError();
  clearFullNameError();
  clearProductError();

}


// ==================================================
// 7. EMPLOYEE LOOKUP
// ==================================================

function clearEmployeeData(exceptField = "") {

  employeeVerified = false;

  if (exceptField !== "employeeID") {
    employeeIDInput.value = "";
  }

  if (exceptField !== "fullName") {
    fullNameInput.value = "";
  }

  departmentInput.value = "";

  clearEmployeeIDError();
  clearFullNameError();

}


// ค้นหาพนักงานจากรหัสหรือชื่อ
async function lookupEmployee(searchType) {

  const searchValue =
    searchType === "employeeID"
      ? employeeIDInput.value.trim()
      : fullNameInput.value.trim();

  if (!searchValue) {
    return;
  }

  const currentSequence = ++employeeLookupSequence;

  employeeVerified = false;
  departmentInput.value = "";

  clearEmployeeIDError();
  clearFullNameError();

  if (searchType === "employeeID") {
    fullNameInput.value = "";
  } else {
    employeeIDInput.value = "";
  }

  // แสดงสถานะกำลังค้นหา
  departmentInput.value = "กำลังค้นหาข้อมูลพนักงาน...";

  try {

    const params = {
      action: "lookupEmployee"
    };

    if (searchType === "employeeID") {
      params.employeeID = searchValue;
    } else {
      params.fullName = searchValue;
    }

    const result = await sendRequest(params);

    // ป้องกันผลลัพธ์เก่าทับข้อมูลใหม่
    if (currentSequence !== employeeLookupSequence) {
      return;
    }

    if (!result || typeof result !== "object") {
      throw new Error("เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง");
    }

    // ไม่พบพนักงาน
    if (result.success !== true || !result.employee) {

      departmentInput.value = "";

      if (searchType === "employeeID") {

        fullNameInput.value = "";

        showEmployeeIDError(
          result.message || "ไม่พบรหัสพนักงานนี้ในระบบ"
        );

      } else {

        employeeIDInput.value = "";

        showFullNameError(
          result.message || "ไม่พบชื่อ-นามสกุลนี้ในระบบ"
        );

      }

      employeeVerified = false;
      return;

    }

    // ตรวจสอบข้อมูลที่ได้รับ
    const employee = result.employee;

    if (
      !employee.employeeID ||
      !employee.fullName ||
      !employee.department
    ) {
      throw new Error("ข้อมูลพนักงานที่ได้รับไม่ครบถ้วน");
    }

    // เติมข้อมูลอัตโนมัติ
    employeeIDInput.value = String(employee.employeeID);
    fullNameInput.value = String(employee.fullName);
    departmentInput.value = String(employee.department);

    employeeVerified = true;

    clearEmployeeIDError();
    clearFullNameError();

  } catch (error) {

    if (currentSequence !== employeeLookupSequence) {
      return;
    }

    console.error("Employee lookup error:", error);

    departmentInput.value = "";
    employeeVerified = false;

    if (searchType === "employeeID") {
      showEmployeeIDError(
        error.message || "ไม่สามารถค้นหาข้อมูลพนักงานได้"
      );
    } else {
      showFullNameError(
        error.message || "ไม่สามารถค้นหาข้อมูลพนักงานได้"
      );
    }

  }

}


// เมื่อกรอกรหัสแล้วออกจากช่อง
employeeIDInput.addEventListener("blur", function () {

  if (employeeIDInput.value.trim()) {
    lookupEmployee("employeeID");
  }

});


// เมื่อกรอกชื่อแล้วออกจากช่อง
fullNameInput.addEventListener("blur", function () {

  if (fullNameInput.value.trim()) {
    lookupEmployee("fullName");
  }

});


// เมื่อแก้ไขรหัสพนักงาน
employeeIDInput.addEventListener("input", function () {

  employeeLookupSequence++;

  employeeVerified = false;

  fullNameInput.value = "";
  departmentInput.value = "";

  clearEmployeeIDError();
  clearFullNameError();

});


// เมื่อแก้ไขชื่อ-นามสกุล
fullNameInput.addEventListener("input", function () {

  employeeLookupSequence++;

  employeeVerified = false;

  employeeIDInput.value = "";
  departmentInput.value = "";

  clearEmployeeIDError();
  clearFullNameError();

});


// ==================================================
// 8. PRODUCT ERROR CLEAR
// ==================================================

productInput.addEventListener("input", clearProductError);


// ==================================================
// 9. SEND REQUEST (JSONP)
// ==================================================

function sendRequest(params) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "productCallback_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    const script = document.createElement("script");

    let finished = false;

    const timeout = setTimeout(() => {

      if (!cleanup()) return;

      reject(new Error("หมดเวลารอการตอบกลับจากเซิร์ฟเวอร์"));

    }, 25000);

    function cleanup() {

      if (finished) return false;

      finished = true;

      clearTimeout(timeout);

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      return true;

    }

    window[callbackName] = function (result) {

      if (!cleanup()) return;

      resolve(result);

    };

    const query = new URLSearchParams({
      ...params,
      callback: callbackName
    });

    script.src = SCRIPT_URL + "?" + query.toString();

    script.onerror = function () {

      if (!cleanup()) return;

      reject(new Error("ไม่สามารถเชื่อมต่อระบบได้"));

    };

    document.body.appendChild(script);

  });

}


// ==================================================
// 10. FORM SUBMIT
// ==================================================

form.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearAllErrors();

  const employeeID = employeeIDInput.value.trim();
  const fullName = fullNameInput.value.trim();
  const department = departmentInput.value.trim();

  const productName = productInput.value.trim();
  const targetCustomer = targetCustomerInput.value.trim();
  const usageDetails = usageInput.value.trim();

  // ตรวจสอบข้อมูลพนักงาน
  if (!employeeID || !fullName || !department || !employeeVerified) {

    if (!employeeID) {
      showEmployeeIDError("กรุณากรอกรหัสพนักงาน");
      employeeIDInput.focus();
    } else if (!fullName) {
      showFullNameError("กรุณากรอกชื่อ-นามสกุล");
      fullNameInput.focus();
    } else {
      showEmployeeIDError(
        "กรุณาค้นหาและยืนยันข้อมูลพนักงานก่อนส่งแบบฟอร์ม"
      );
      employeeIDInput.focus();
    }

    return;

  }

  // ตรวจสอบข้อมูลอื่น
  if (!productName || !targetCustomer || !usageDetails) {

    form.reportValidity();
    return;

  }

  // ป้องกันการกดส่งซ้ำ
  submitBtn.disabled = true;
  submitText.textContent = "กำลังตรวจสอบข้อมูล...";

  try {

    const result = await sendRequest({

      action: "submit",

      employeeID: employeeID,
      fullName: fullName,
      department: department,

      productName: productName,
      targetCustomer: targetCustomer,
      usageDetails: usageDetails

    });

    if (!result || typeof result !== "object") {
      throw new Error("เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง");
    }

    // ==============================================
    // ตรวจสอบข้อมูลซ้ำ
    // ==============================================

    const isDuplicateFullName =
      result.duplicateFullName === true;

    const isDuplicateProduct =
      result.duplicate === true;

    if (isDuplicateFullName || isDuplicateProduct) {

      if (isDuplicateFullName) {

        showFullNameError(
          "ชื่อ-นามสกุลนี้เคยส่งแบบฟอร์มแล้ว ไม่สามารถส่งซ้ำได้"
        );

      }

      if (isDuplicateProduct) {

        showProductError(
          "ชื่อสินค้านี้มีอยู่ในระบบแล้ว กรุณากรอกชื่อใหม่"
        );

      }

      if (isDuplicateFullName) {
        fullNameInput.focus();
      } else {
        productInput.focus();
      }

      return;

    }

    // ==============================================
    // บันทึกสำเร็จ
    // ==============================================

    if (result.success === true) {

      form.reset();

      employeeVerified = false;
      employeeLookupSequence++;

      clearAllErrors();

      showPopup(
        result.message ||
        "ส่งข้อมูลสำเร็จ! ระบบบันทึกข้อมูลเรียบร้อยแล้ว",
        "success"
      );

      return;

    }

    // ==============================================
    // ข้อผิดพลาดอื่น
    // ==============================================

    throw new Error(
      result.message ||
      "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
    );

  } catch (error) {

    console.error("Submit error:", error);

    showPopup(
      error.message ||
      "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง",
      "error"
    );

  } finally {

    submitBtn.disabled = false;
    submitText.textContent = "ส่งข้อมูล";

  }

});
