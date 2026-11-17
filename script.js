
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEWHRDtzur0r4jgNQGXC6jRRGn3c4RmQqPitJFPK4Ex0LXxZujpZq545l8WurQPP4PZw/exec";

// ==================================================
// 1. ELEMENTS
// ==================================================

const welcomePage = document.getElementById("welcomePage");
const formPage = document.getElementById("formPage");
const enterFormBtn = document.getElementById("enterFormBtn");

const form = document.getElementById("productForm");

const employeeIDInput = document.getElementById("employeeID");
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

const fullNameError = document.getElementById("fullNameError");
const productNameError = document.getElementById("productNameError");

let previousFocus = null;
let employeeVerified = false;
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
// 4. ERROR HANDLING
// ==================================================

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

function clearAllErrors() {

    clearFullNameError();
    clearProductError();

}


// ==================================================
// 5. EMPLOYEE LOOKUP
// ค้นหาจากชื่อ-นามสกุลเท่านั้น
// ==================================================

function clearEmployeeData() {

    employeeVerified = false;

    employeeIDInput.value = "";
    departmentInput.value = "";

}

async function lookupEmployee() {

    const searchValue = fullNameInput.value.trim();

    if (!searchValue) {
        clearEmployeeData();
        return;
    }

    const currentSequence = ++employeeLookupSequence;

    employeeVerified = false;

    employeeIDInput.value = "";
    departmentInput.value = "กำลังค้นหาข้อมูลพนักงาน...";

    clearFullNameError();

    try {

        const result = await sendRequest({
            action: "lookupEmployee",
            fullName: searchValue
        });

        // ป้องกันผลค้นหาเก่าทับผลค้นหาใหม่
        if (currentSequence !== employeeLookupSequence) {
            return;
        }

        if (!result || typeof result !== "object") {
            throw new Error("เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง");
        }

        // ไม่พบพนักงาน
        if (result.success !== true || !result.employee) {

            clearEmployeeData();

            showFullNameError(
                result.message || "ไม่พบชื่อ-นามสกุลนี้ในระบบ กรุณาตรวจสอบชื่ออีกครั้ง"
            );

            return;
        }

        const employee = result.employee;

        // ตรวจสอบข้อมูลที่ได้รับ
        if (
            !employee.employeeID ||
            !employee.fullName ||
            !employee.department
        ) {
            throw new Error("ข้อมูลพนักงานที่ได้รับไม่ครบถ้วน");
        }

        // เติมข้อมูลจากฐานข้อมูล
        employeeIDInput.value = String(employee.employeeID);
        fullNameInput.value = String(employee.fullName);
        departmentInput.value = String(employee.department);

        employeeVerified = true;

        clearFullNameError();

    } catch (error) {

        if (currentSequence !== employeeLookupSequence) {
            return;
        }

        console.error("Employee lookup error:", error);

        clearEmployeeData();

        showFullNameError(
            error.message || "ไม่สามารถค้นหาข้อมูลพนักงานได้ กรุณาลองใหม่"
        );

    }

}


// เมื่อกรอกชื่อแล้วออกจากช่อง ให้ค้นหาพนักงาน
fullNameInput.addEventListener("blur", function () {

    if (fullNameInput.value.trim()) {
        lookupEmployee();
    }

});


// เมื่อแก้ไขชื่อ ให้ยกเลิกข้อมูลพนักงานเดิม
fullNameInput.addEventListener("input", function () {

    employeeLookupSequence++;

    clearEmployeeData();
    clearFullNameError();

});


// ==================================================
// 6. PRODUCT ERROR CLEAR
// ==================================================

productInput.addEventListener("input", clearProductError);


// ==================================================
// 7. SEND REQUEST (JSONP)
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
// 8. FORM SUBMIT
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

    // ----------------------------------------------
    // ตรวจสอบข้อมูลพนักงาน
    // ----------------------------------------------

    if (!fullName) {

        showFullNameError("กรุณากรอกชื่อ-นามสกุล");
        fullNameInput.focus();

        return;
    }

    if (!employeeVerified || !employeeID || !department) {

        showFullNameError(
            "กรุณากรอกชื่อ-นามสกุลและรอให้ระบบตรวจสอบข้อมูลพนักงานก่อนส่งแบบฟอร์ม"
        );

        fullNameInput.focus();

        return;
    }

    // ----------------------------------------------
    // ตรวจสอบข้อมูลสินค้า
    // ----------------------------------------------

    if (!productName || !targetCustomer || !usageDetails) {

        form.reportValidity();
        return;

    }

    // ----------------------------------------------
    // ป้องกันการกดส่งซ้ำ
    // ----------------------------------------------

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

        // ------------------------------------------
        // ตรวจสอบข้อมูลซ้ำ
        // ------------------------------------------

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

        // ------------------------------------------
        // บันทึกสำเร็จ
        // ------------------------------------------

        if (result.success === true) {

            form.reset();

            employeeVerified = false;
            employeeLookupSequence++;

            clearEmployeeData();
            clearAllErrors();

            showPopup(
                result.message ||
                "ส่งข้อมูลสำเร็จ! ระบบบันทึกข้อมูลเรียบร้อยแล้ว",
                "success"
            );

            return;

        }

        // ------------------------------------------
        // ข้อผิดพลาดอื่น
        // ------------------------------------------

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
