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
const loadingIndicator = document.getElementById("loadingIndicator");

const fullNameError = document.getElementById("fullNameError");
const productNameError = document.getElementById("productNameError");

let previousFocus = null;
let employeeVerified = false;
let employeeLookupSequence = 0;
let isSubmitting = false;


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

function openPopup() {

    statusBox.hidden = false;
    statusBox.setAttribute("aria-hidden", "false");

}


// Popup ระหว่างกำลังส่งข้อมูล
function showLoadingPopup() {

    previousFocus = document.activeElement;

    statusBox.classList.remove("success", "error");
    statusBox.classList.add("loading");

    popupIcon.textContent = "";
    popupTitle.textContent = "กำลังส่งข้อมูล...";
    popupMessage.textContent =
        "กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลของคุณ";

    if (loadingIndicator) {
        loadingIndicator.hidden = false;
    }

    popupClose.hidden = true;

    openPopup();

    // ป้องกันการปิด Popup ระหว่างส่งข้อมูล
    statusBox.setAttribute("tabindex", "-1");
    statusBox.focus();

}


// Popup แจ้งผลสำเร็จหรือผิดพลาด
function showPopup(message, type = "success") {

    // เก็บตำแหน่ง Focus เฉพาะตอนเปิด Popup ใหม่
    if (statusBox.hidden) {
        previousFocus = document.activeElement;
    }

    statusBox.classList.remove("success", "error", "loading");
    statusBox.classList.add(type);

    if (type === "success") {

        popupIcon.textContent = "✓";
        popupTitle.textContent = "ส่งข้อมูลสำเร็จ!";

    } else {

        popupIcon.textContent = "!";
        popupTitle.textContent = "เกิดข้อผิดพลาด";

    }

    popupMessage.textContent = message;

    if (loadingIndicator) {
        loadingIndicator.hidden = true;
    }

    popupClose.hidden = false;

    openPopup();

    popupClose.focus();

}


// ปิด Popup
function hidePopup(force = false) {

    // ห้ามปิดขณะกำลังส่งข้อมูล
    if (isSubmitting && !force) {
        return;
    }

    statusBox.hidden = true;
    statusBox.setAttribute("aria-hidden", "true");

    if (loadingIndicator) {
        loadingIndicator.hidden = true;
    }

    popupClose.hidden = false;

    if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
    }

}


// ปุ่มตกลง
popupClose.addEventListener("click", function () {

    hidePopup();

});


// คลิกพื้นหลังเพื่อปิด Popup
statusBox.addEventListener("click", function (event) {

    if (event.target === statusBox) {
        hidePopup();
    }

});


// กด Escape เพื่อปิด Popup
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

            throw new Error(
                "เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง"
            );

        }

        // ไม่พบพนักงาน
        if (result.success !== true || !result.employee) {

            clearEmployeeData();

            showFullNameError(
                result.message ||
                "ไม่พบชื่อ-นามสกุลนี้ในระบบ กรุณาตรวจสอบชื่ออีกครั้ง"
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

            throw new Error(
                "ข้อมูลพนักงานที่ได้รับไม่ครบถ้วน"
            );

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
            error.message ||
            "ไม่สามารถค้นหาข้อมูลพนักงานได้ กรุณาลองใหม่"
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

            reject(
                new Error("หมดเวลารอการตอบกลับจากเซิร์ฟเวอร์")
            );

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

            reject(
                new Error("ไม่สามารถเชื่อมต่อระบบได้")
            );

        };


        document.body.appendChild(script);

    });

}


// ==================================================
// 7.1 SEND LONG DATA IN CHUNKS
// ==================================================

async function sendChunkedRequest(params) {

    // จำกัดขนาดข้อมูลที่ส่งได้
    const MAX_DATA_LENGTH = 49900;

    // แบ่งข้อมูลครั้งละ 500 ตัวอักษร (ต้องตรงกับ CHUNK_SIZE ใน Code.gs)
    const CHUNK_SIZE = 500;

    const payload = JSON.stringify(params);

    if (payload.length > MAX_DATA_LENGTH) {

        throw new Error(
            "ข้อมูลมีขนาดใหญ่เกินไป กรุณาลดความยาวรายละเอียดการใช้งาน"
        );

    }

    // Array.from ป้องกันการตัดอักขระภาษาไทยหรือ Emoji กลางตัว
    const characters = Array.from(payload);

    const chunks = [];

    for (let i = 0; i < characters.length; i += CHUNK_SIZE) {

        chunks.push(
            characters.slice(i, i + CHUNK_SIZE).join("")
        );

    }

    const token =
        "product_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2);

    let result = null;

    // ส่งข้อมูลทีละชุดตามลำดับ
    for (let i = 0; i < chunks.length; i++) {

        result = await sendRequest({

            action: "submitChunk",

            token: token,

            index: String(i),

            total: String(chunks.length),

            chunk: chunks[i]

        });

        if (!result || typeof result !== "object") {

            throw new Error(
                "เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง"
            );

        }

        // ชุดที่ยังไม่ใช่ชุดสุดท้าย ต้องได้รับการยืนยัน
        if (i < chunks.length - 1) {

            if (result.success !== true || result.received !== true) {

                throw new Error(
                    result.message ||
                    "ไม่สามารถส่งข้อมูลบางส่วนได้"
                );

            }

        }

    }

    // ผลลัพธ์ชุดสุดท้ายคือผลการบันทึกจริง
    return result;

}




// ==================================================
// 7.2 PRODUCT IMAGE UPLOAD
// อัปโหลด "ไฟล์ต้นฉบับ" เท่านั้น ไม่บีบอัด ไม่ลดคุณภาพ
// ไม่สร้าง Preview ในขั้นตอนนี้ (Backend สร้างภายหลัง)
// ==================================================

const MAX_IMAGE_COUNT = 3;

// ต่อรูป
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

// ขนาดไฟล์ต้นฉบับรวมกันทุกรูป
const MAX_TOTAL_IMAGE_SIZE = 20 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

let selectedProductImages = [];

function formatFileSize(bytes) {

    const size = Number(bytes || 0);

    if (size >= 1024 * 1024) {
        return (size / 1024 / 1024).toFixed(2) + " MB";
    }

    return Math.max(1, Math.round(size / 1024)) + " KB";

}


function ensureImageUploadUI() {
    // หากหน้า HTML มีช่องอัปโหลดอยู่แล้ว ให้ใช้ของเดิม
    let imageInput = document.getElementById("productImages") ||
                     document.getElementById("imageFiles");
    let preview = document.getElementById("imagePreview");

    if (imageInput && preview) {
        imageInput.multiple = true;
        imageInput.accept = "image/jpeg,image/png,image/webp";
        return { imageInput, preview };
    }

    const section = document.createElement("section");
    section.id = "productImageUpload";
    section.style.cssText = [
        "margin:20px 0",
        "padding:16px",
        "border:1px solid #d8dee8",
        "border-radius:12px",
        "background:#fafbfc"
    ].join(";");

    const title = document.createElement("label");
    title.htmlFor = "productImages";
    title.textContent = "รูปภาพประกอบข้อเสนอสินค้า (ไม่เกิน 3 รูป)";
    title.style.cssText = "display:block;font-weight:600;margin-bottom:8px";

    const note = document.createElement("p");
    note.id = "productImageNote";
    note.textContent =
        "รองรับ JPG, PNG และ WEBP สูงสุด 3 รูป ขนาดไฟล์ต้นฉบับรวมกันไม่เกิน 20 MB";
    note.style.cssText = "font-size:13px;color:#64748b;margin:0 0 10px";

    imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.id = "productImages";
    imageInput.name = "productImages";
    imageInput.multiple = true;
    imageInput.accept = "image/jpeg,image/png,image/webp";
    imageInput.style.cssText = "display:block;width:100%;max-width:100%";

    preview = document.createElement("div");
    preview.id = "imagePreview";
    preview.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-top:12px";

    section.append(title, note, imageInput, preview);

    const insertPoint = submitBtn && submitBtn.parentElement
        ? submitBtn.parentElement
        : null;

    if (insertPoint && insertPoint !== form) {
        form.insertBefore(section, insertPoint);
    } else {
        form.appendChild(section);
    }

    return { imageInput, preview };
}

const imageUploadElements = ensureImageUploadUI();
const productImageInput = imageUploadElements.imageInput;
const productImagePreview = imageUploadElements.preview;

function clearSelectedProductImages() {
    selectedProductImages.forEach(function(item) {
        if (item.previewURL) URL.revokeObjectURL(item.previewURL);
    });

    selectedProductImages = [];
    if (productImageInput) productImageInput.value = "";
    if (productImagePreview) productImagePreview.replaceChildren();
}


function getSelectedTotalSize() {
    return selectedProductImages.reduce(function(total, item) {
        return total + Number(item.file.size || 0);
    }, 0);
}


function renderSelectedProductImages() {
    productImagePreview.replaceChildren();

    selectedProductImages.forEach(function(item, index) {
        const card = document.createElement("div");
        card.style.cssText =
            "width:104px;padding:6px;border:1px solid #e2e8f0;border-radius:8px;background:#fff";

        const img = document.createElement("img");
        img.src = item.previewURL;
        img.alt = item.file.name;
        img.style.cssText =
            "width:100%;height:76px;object-fit:cover;border-radius:5px";

        const name = document.createElement("div");
        name.textContent = item.file.name;
        name.title = item.file.name;
        name.style.cssText =
            "font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:5px";

        const size = document.createElement("div");
        size.textContent = formatFileSize(item.file.size);
        size.style.cssText = "font-size:11px;color:#64748b";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "ลบ";
        remove.style.cssText =
            "margin-top:5px;font-size:12px;cursor:pointer";
        remove.addEventListener("click", function() {
            URL.revokeObjectURL(item.previewURL);
            selectedProductImages.splice(index, 1);
            renderSelectedProductImages();
        });

        card.append(img, name, size, remove);
        productImagePreview.appendChild(card);
    });

    if (selectedProductImages.length > 0) {
        const summary = document.createElement("div");
        summary.style.cssText =
            "flex-basis:100%;font-size:12px;color:#475569;margin-top:4px";
        summary.textContent =
            "เลือกแล้ว " + selectedProductImages.length + " จาก " +
            MAX_IMAGE_COUNT + " รูป รวม " +
            formatFileSize(getSelectedTotalSize()) + " / " +
            formatFileSize(MAX_TOTAL_IMAGE_SIZE);
        productImagePreview.appendChild(summary);
    }
}


// ตรวจสอบชุดรูปที่เลือกทั้งหมด (จำนวน / ชนิด / ขนาดต่อรูป / ขนาดรวม)
function validateSelectedProductImages() {

    if (selectedProductImages.length > MAX_IMAGE_COUNT) {
        return "แนบรูปภาพได้สูงสุด " + MAX_IMAGE_COUNT + " รูปต่อข้อเสนอ";
    }

    for (let i = 0; i < selectedProductImages.length; i++) {

        const file = selectedProductImages[i].file;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return "ไฟล์ " + file.name + " ไม่ใช่ JPG, PNG หรือ WEBP";
        }

        if (file.size <= 0) {
            return "ไฟล์ " + file.name + " ว่างเปล่า";
        }

        if (file.size > MAX_IMAGE_SIZE) {
            return "ไฟล์ " + file.name + " มีขนาด " +
                formatFileSize(file.size) + " เกินกำหนด " +
                formatFileSize(MAX_IMAGE_SIZE) + " ต่อรูป";
        }

    }

    const totalSize = getSelectedTotalSize();

    if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
        return "ขนาดไฟล์ต้นฉบับรวมกัน " + formatFileSize(totalSize) +
            " เกินกำหนด " + formatFileSize(MAX_TOTAL_IMAGE_SIZE);
    }

    return "";

}


productImageInput.addEventListener("change", function() {

    const incoming = Array.from(productImageInput.files || []);

    // เคลียร์ค่า input เพื่อให้เลือกไฟล์ชุดเดิมซ้ำได้ในครั้งถัดไป
    productImageInput.value = "";

    if (!incoming.length) {
        return;
    }

    if (selectedProductImages.length + incoming.length > MAX_IMAGE_COUNT) {
        showPopup(
            "แนบรูปภาพได้สูงสุด " + MAX_IMAGE_COUNT +
            " รูปต่อข้อเสนอ (เลือกไว้แล้ว " +
            selectedProductImages.length + " รูป)",
            "error"
        );
        return;
    }

    const invalidType = incoming.find(function(file) {
        return !ALLOWED_IMAGE_TYPES.includes(file.type);
    });

    if (invalidType) {
        showPopup(
            "ไฟล์ " + invalidType.name +
            " ไม่ถูกต้อง รองรับเฉพาะ JPG, PNG และ WEBP",
            "error"
        );
        return;
    }

    const invalidSize = incoming.find(function(file) {
        return file.size <= 0 || file.size > MAX_IMAGE_SIZE;
    });

    if (invalidSize) {
        showPopup(
            "ไฟล์ " + invalidSize.name + " มีขนาด " +
            formatFileSize(invalidSize.size) + " เกินกำหนด " +
            formatFileSize(MAX_IMAGE_SIZE) + " ต่อรูป",
            "error"
        );
        return;
    }

    const newTotal = getSelectedTotalSize() + incoming.reduce(
        function(total, file) {
            return total + Number(file.size || 0);
        },
        0
    );

    if (newTotal > MAX_TOTAL_IMAGE_SIZE) {
        showPopup(
            "ขนาดไฟล์ต้นฉบับรวมกัน " + formatFileSize(newTotal) +
            " เกินกำหนด " + formatFileSize(MAX_TOTAL_IMAGE_SIZE),
            "error"
        );
        return;
    }

    incoming.forEach(function(file) {
        selectedProductImages.push({
            file: file,
            previewURL: URL.createObjectURL(file)
        });
    });

    renderSelectedProductImages();

});


function readFileAsDataURL(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();

        reader.onload = function() {
            resolve(String(reader.result || ""));
        };

        reader.onerror = function() {
            reject(new Error("ไม่สามารถอ่านไฟล์ " + file.name + " ได้"));
        };

        reader.readAsDataURL(file);
    });
}


async function uploadOneProductImage(employeeID, file) {
    // ส่งไฟล์ต้นฉบับตามเดิม ไม่มีการบีบอัดหรือลดคุณภาพ
    const dataURL = await readFileAsDataURL(file);

    // URLSearchParams จะ encode Base64 สำหรับ application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set("action", "uploadImage");
    body.set("employeeID", employeeID);
    body.set("fileName", file.name);
    body.set("mimeType", file.type);
    body.set("base64", dataURL);

    const controller = new AbortController();
    const timeout = setTimeout(function() {
        controller.abort();
    }, 90000);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: body.toString(),
            redirect: "follow",
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error("เซิร์ฟเวอร์อัปโหลดรูปภาพตอบกลับ HTTP " + response.status);
        }

        const result = await response.json();

        if (!result || result.success !== true || !result.fileId) {
            throw new Error(
                result && result.message
                    ? result.message
                    : "อัปโหลดรูปภาพไม่สำเร็จ"
            );
        }

        return result;

    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("หมดเวลารออัปโหลดรูปภาพ " + file.name);
        }

        // หากเป็น CORS error จะไม่สามารถยืนยันผลการอัปโหลดจาก Browser ได้
        if (error instanceof TypeError) {
            throw new Error(
                "เบราว์เซอร์ไม่อนุญาตให้อ่านผลตอบกลับจาก Google Apps Script (อาจเป็นปัญหา CORS) " +
                "จึงยังยืนยันการอัปโหลดรูปภาพไม่ได้ กรุณาตรวจสอบการตั้งค่า Web App"
            );
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
}


/**
 * อัปโหลดรูปทั้งหมดและคืนค่า File ID
 * หากรูปใดล้มเหลว จะลบรูปที่อัปโหลดไปแล้วเพื่อไม่ให้มีไฟล์ค้างใน Drive
 */
async function uploadSelectedProductImages(employeeID) {

    const uploadedIds = [];

    try {

        for (let i = 0; i < selectedProductImages.length; i++) {

            const item = selectedProductImages[i];

            popupTitle.textContent = "กำลังอัปโหลดรูปภาพ...";
            popupMessage.textContent =
                "กำลังอัปโหลดรูปที่ " + (i + 1) + " จาก " +
                selectedProductImages.length + " รูป (" +
                formatFileSize(item.file.size) + ") กรุณารอสักครู่";

            const result = await uploadOneProductImage(employeeID, item.file);

            uploadedIds.push(result.fileId);

        }

        return uploadedIds;

    } catch (error) {

        await discardUploadedImages(employeeID, uploadedIds);

        throw error;

    }

}


/**
 * แจ้ง Backend ให้ลบรูปที่อัปโหลดไว้แต่ยังไม่ได้บันทึกลงชีต
 * (ไม่ลบไฟล์ที่ถูกอ้างอิงในคอลัมน์ M แล้ว)
 */
async function discardUploadedImages(employeeID, fileIds) {

    if (!fileIds || !fileIds.length) {
        return;
    }

    try {

        const body = new URLSearchParams();
        body.set("action", "discardImages");
        body.set("employeeID", employeeID);
        body.set("fileIds", fileIds.join(","));

        await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: body.toString(),
            redirect: "follow"
        });

    } catch (error) {

        // การลบไฟล์เป็นงานทำความสะอาด ไม่ควรทำให้การแจ้งผลล้มเหลว
        console.warn("Discard uploaded images error:", error);

    }

}


// ==================================================
// 8. FORM SUBMIT
// ==================================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    // ป้องกันการกดส่งซ้ำ
    if (isSubmitting) {
        return;
    }

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
    // ตรวจสอบรูปภาพ (จำนวน / ชนิด / ขนาดรวม)
    // ----------------------------------------------

    const imageError = validateSelectedProductImages();

    if (imageError) {

        showPopup(imageError, "error");

        return;

    }


    // ----------------------------------------------
    // เริ่มส่งข้อมูล
    // ----------------------------------------------

    isSubmitting = true;

    submitBtn.disabled = true;
    submitText.textContent = "กำลังส่งข้อมูล...";

    // แสดง Popup ทันทีเมื่อเริ่มส่งข้อมูล
    showLoadingPopup();

    let uploadedFileIds = [];
    let submissionSaved = false;


    try {

        // ------------------------------------------
        // ขั้นตอนที่ 1: อัปโหลดรูปต้นฉบับ (ถ้ามี)
        // ------------------------------------------

        if (selectedProductImages.length > 0) {

            uploadedFileIds = await uploadSelectedProductImages(employeeID);

        }

        popupTitle.textContent = "กำลังส่งข้อมูล...";
        popupMessage.textContent =
            "กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลของคุณ";


        // ------------------------------------------
        // ขั้นตอนที่ 2: ส่งเฉพาะ File ID ไปบันทึก
        // (Backend สร้าง Preview ภายหลัง ไม่ทำให้ผู้ใช้รอ)
        // ------------------------------------------

        const result = await sendChunkedRequest({

            action: "submit",

            employeeID: employeeID,
            fullName: fullName,
            department: department,

            productName: productName,
            targetCustomer: targetCustomer,
            usageDetails: usageDetails,

            imageFileIds: uploadedFileIds.join(",")

        });


        if (!result || typeof result !== "object") {

            throw new Error(
                "เซิร์ฟเวอร์ส่งข้อมูลกลับมาไม่ถูกต้อง"
            );

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

            // ปิด Popup กำลังส่ง เพื่อให้แก้ไขข้อมูลได้
            hidePopup(true);

            if (isDuplicateFullName) {

                fullNameInput.focus();

            } else {

                productInput.focus();

            }

            return;

        }


        // ------------------------------------------
        // บันทึกสำเร็จ (แจ้งผลทันที ไม่รอ Preview)
        // ------------------------------------------

        if (result.success === true) {

            submissionSaved = true;
            uploadedFileIds = [];

            form.reset();
            clearSelectedProductImages();

            employeeVerified = false;
            employeeLookupSequence++;

            clearEmployeeData();
            clearAllErrors();

            // เปลี่ยน Popup จากกำลังส่งเป็นส่งสำเร็จ
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

        // ถ้าบันทึกข้อมูลไม่สำเร็จ ให้ลบรูปที่อัปโหลดค้างไว้
        if (!submissionSaved && uploadedFileIds.length > 0) {
            await discardUploadedImages(employeeID, uploadedFileIds);
        }

        isSubmitting = false;

        submitBtn.disabled = false;
        submitText.textContent = "ส่งข้อมูล";

    }

});
