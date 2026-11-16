
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEWHRDtzur0r4jgNQGXC6jRRGn3c4RmQqPitJFPK4Ex0LXxZujpZq545l8WurQPP4PZw/exec";

// ==================================================
// 1. ELEMENTS
// ==================================================

const form = document.getElementById("productForm");

const fullNameInput = document.getElementById("fullName");
const departmentInput = document.getElementById("department");
const productInput = document.getElementById("productName");
const targetCustomerInput = document.getElementById("targetCustomer");
const usageInput = document.getElementById("usageDetails");

const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");

const statusBox = document.getElementById("status");
const popupIcon = document.getElementById("popupIcon");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const popupClose = document.getElementById("popupClose");

const productNameError = document.getElementById("productNameError");
const fullNameError = document.getElementById("fullNameError");

let previousFocus = null;

// ==================================================
// 2. POPUP
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
// 3. DUPLICATE FULL NAME ERROR
// ==================================================

function showFullNameError(message) {

  fullNameInput.classList.add("input-error");
  fullNameInput.setAttribute("aria-invalid", "true");

  if (fullNameError) {
    fullNameError.textContent = message;
    fullNameError.hidden = false;
  }

}

function clearFullNameError() {

  fullNameInput.classList.remove("input-error");
  fullNameInput.removeAttribute("aria-invalid");

  if (fullNameError) {
    fullNameError.textContent = "";
    fullNameError.hidden = true;
  }

}

// ==================================================
// 4. DUPLICATE PRODUCT ERROR
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

// ล้างข้อความเตือนเมื่อผู้ใช้แก้ไขข้อมูล
fullNameInput.addEventListener("input", clearFullNameError);
productInput.addEventListener("input", clearProductError);

// ==================================================
// 5. CLEAR ALL DUPLICATE ERRORS
// ==================================================

function clearAllErrors() {
  clearFullNameError();
  clearProductError();
}

// ==================================================
// 6. SEND REQUEST (JSONP)
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
// 7. FORM SUBMIT
// ==================================================

form.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearAllErrors();

  const fullName = fullNameInput.value.trim();
  const department = departmentInput.value;
  const productName = productInput.value.trim();
  const targetCustomer = targetCustomerInput.value.trim();
  const usageDetails = usageInput.value.trim();

  // ตรวจสอบข้อมูลที่จำเป็น
  if (
    !fullName ||
    !department ||
    !productName ||
    !targetCustomer ||
    !usageDetails
  ) {

    form.reportValidity();

    return;

  }

  // ป้องกันการกดส่งซ้ำ
  submitBtn.disabled = true;
  submitText.textContent = "กำลังตรวจสอบข้อมูล...";

  try {

    const result = await sendRequest({

      action: "submit",

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
    // ตรวจสอบชื่อผู้ส่งและชื่อสินค้าซ้ำ
    // ==============================================

    const isDuplicateFullName =
      result.duplicateFullName === true;

    const isDuplicateProduct =
      result.duplicate === true;

    if (isDuplicateFullName || isDuplicateProduct) {

      // ชื่อ-นามสกุลซ้ำ
      if (isDuplicateFullName) {

        showFullNameError(
          "ชื่อ-นามสกุลนี้เคยส่งแบบฟอร์มแล้ว ไม่สามารถส่งซ้ำได้"
        );

      }

      // ชื่อสินค้าซ้ำ
      if (isDuplicateProduct) {

        showProductError(
          "ชื่อสินค้านี้มีอยู่ในระบบแล้ว กรุณากรอกชื่อใหม่"
        );

      }

      // ให้โฟกัสช่องแรกที่พบปัญหา
      if (isDuplicateFullName) {

        fullNameInput.focus();

      } else if (isDuplicateProduct) {

        productInput.focus();

      }

      return;

    }

    // ==============================================
    // บันทึกสำเร็จ
    // ==============================================

    if (result.success === true) {

      form.reset();

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
