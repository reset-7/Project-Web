/* =====================================================
   CONFIGURATION
===================================================== */


/*
    IMPORTANT:

    Replace this URL with your actual Cloudinary
    .docx file URL.

    Example:

    https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/
    v1234567890/Daily_check_Medical_Air.docx
*/

const TEMPLATE_URL =
    "https://res.cloudinary.com/qefnefgn/raw/upload/v1790154975/Daily_check_Medical_Air.docx";


/*
    Name used for downloaded files.
*/

const OUTPUT_PREFIX =
    "Out";


/* =====================================================
   THAI MONTHS
===================================================== */

const THAI_MONTHS = [

    "มกราคม",

    "กุมภาพันธ์",

    "มีนาคม",

    "เมษายน",

    "พฤษภาคม",

    "มิถุนายน",

    "กรกฎาคม",

    "สิงหาคม",

    "กันยายน",

    "ตุลาคม",

    "พฤศจิกายน",

    "ธันวาคม"

];


/* =====================================================
   DOM ELEMENTS
===================================================== */

const yearInput =
    document.getElementById(
        "year"
    );


const monthInput =
    document.getElementById(
        "month"
    );


const thaiMonthDisplay =
    document.getElementById(
        "thaiMonth"
    );


const thaiYearDisplay =
    document.getElementById(
        "thaiYear"
    );


const daysDisplay =
    document.getElementById(
        "daysInMonth"
    );


const sundaysDisplay =
    document.getElementById(
        "sundays"
    );


const generateDocxButton =
    document.getElementById(
        "generateDocxButton"
    );


const generatePdfButton =
    document.getElementById(
        "generatePdfButton"
    );


const progress =
    document.getElementById(
        "progress"
    );


const message =
    document.getElementById(
        "message"
    );


const templateStatus =
    document.getElementById(
        "templateStatus"
    );


const pdfRenderArea =
    document.getElementById(
        "pdfRenderArea"
    );


/* =====================================================
   INITIALIZE
===================================================== */

function initialize() {

    const currentYear =
        new Date().getFullYear();


    yearInput.value =
        currentYear;


    populateMonths();


    const currentMonth =
        new Date().getMonth();


    monthInput.value =
        currentMonth + 1;


    updatePreview();


    checkTemplate();

}


/* =====================================================
   POPULATE MONTHS
===================================================== */

function populateMonths() {

    monthInput.innerHTML =
        "";


    THAI_MONTHS.forEach(
        (
            monthName,
            index
        ) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                index + 1;


            option.textContent =
                `${index + 1} - ${monthName}`;


            monthInput.appendChild(
                option
            );

        }
    );

}


/* =====================================================
   GET DAYS IN MONTH
===================================================== */

function getDaysInMonth(
    year,
    month
) {

    /*
        month = 1-12

        Date(year, month, 0)
        gives the last day of the
        selected month.
    */

    return new Date(
        year,
        month,
        0
    ).getDate();

}


/* =====================================================
   GET SUNDAYS
===================================================== */

function getSundays(
    year,
    month
) {

    const days =
        getDaysInMonth(
            year,
            month
        );


    const sundays = [];


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            new Date(
                year,
                month - 1,
                day
            );


        /*
            JavaScript:
            Sunday = 0
        */

        if (
            date.getDay() === 0
        ) {

            sundays.push(
                day
            );

        }

    }


    return sundays;

}


/* =====================================================
   UPDATE PREVIEW
===================================================== */

function updatePreview() {

    const year =
        Number(
            yearInput.value
        );


    const month =
        Number(
            monthInput.value
        );


    if (
        !year ||
        !month
    ) {

        return;

    }


    const days =
        getDaysInMonth(
            year,
            month
        );


    const sundays =
        getSundays(
            year,
            month
        );


    const thaiYear =
        year + 543;


    thaiMonthDisplay.textContent =
        THAI_MONTHS[
            month - 1
        ];


    thaiYearDisplay.textContent =
        thaiYear;


    daysDisplay.textContent =
        days;


    sundaysDisplay.textContent =
        sundays.length
            ? sundays.join(
                ", "
            )
            : "-";

}


/* =====================================================
   CREATE REPLACEMENT DATA
===================================================== */

function createReplacementData(
    year,
    month
) {

    const days =
        getDaysInMonth(
            year,
            month
        );


    const sundays =
        getSundays(
            year,
            month
        );


    const replacements = {};


    /*
        {month}
    */

    replacements["month"] =
        THAI_MONTHS[
            month - 1
        ];


    /*
        {year}
    */

    replacements["year"] =
        String(
            year + 543
        );


    /*
        {1} - {31}
    */

    for (
        let day = 1;
        day <= 31;
        day++
    ) {

        /*
            Day doesn't exist
            in this month.
        */

        if (
            day > days
        ) {

            replacements[
                String(day)
            ] = "";

            continue;

        }


        /*
            Sunday
        */

        if (
            sundays.includes(day)
        ) {

            replacements[
                String(day)
            ] = "-";

            continue;

        }


        /*
            Normal day
        */

        replacements[
            String(day)
        ] = "";

    }


    return replacements;

}


/* =====================================================
   FETCH TEMPLATE
===================================================== */

async function fetchTemplate() {

    if (
        TEMPLATE_URL ===
        "YOUR_CLOUDINARY_DOCX_URL_HERE"
    ) {

        throw new Error(
            "Please set TEMPLATE_URL in app.js."
        );

    }


    const response =
        await fetch(
            TEMPLATE_URL
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Unable to download template. HTTP ${response.status}`
        );

    }


    return await response.arrayBuffer();

}


/* =====================================================
   XML ESCAPE
===================================================== */

function escapeXml(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&apos;"
        );

}


/* =====================================================
   REPLACE PLACEHOLDERS
===================================================== */

function replacePlaceholders(
    xml,
    replacements
) {

    let result =
        xml;


    /*
        Replace {month}
    */

    result =
        result.replace(
            /\{month\}/g,

            escapeXml(
                replacements.month
            )
        );


    /*
        Replace {year}
    */

    result =
        result.replace(
            /\{year\}/g,

            escapeXml(
                replacements.year
            )
        );


    /*
        Replace {1} - {31}

        Start at 31 and work down.
    */

    for (
        let day = 31;
        day >= 1;
        day--
    ) {

        const tag =
            `{${day}}`;


        const escapedTag =
            tag.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );


        const regex =
            new RegExp(
                escapedTag,
                "g"
            );


        result =
            result.replace(
                regex,

                escapeXml(
                    replacements[
                        String(day)
                    ]
                )
            );

    }


    return result;

}


function setDocumentLandscape(xml) {
    const landscapePageSize =
        '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>';

    if (/<w:pgSz\b[^>]*\/>/.test(xml)) {
        return xml.replace(
            /<w:pgSz\b[^>]*\/>/,
            landscapePageSize
        );
    }

    // Handle a page-size element with an explicit closing tag
    if (/<w:pgSz\b[^>]*>[\s\S]*?<\/w:pgSz>/.test(xml)) {
        return xml.replace(
            /<w:pgSz\b[^>]*>[\s\S]*?<\/w:pgSz>/,
            landscapePageSize
        );
    }

    console.warn("Could not find w:pgSz in document.xml");
    return xml;
}


async function createModifiedDocx() {
    const year = Number(yearInput.value);
    const month = Number(monthInput.value);

    if (!year || year < 2000 || year > 2100) {
        throw new Error("Please enter a valid year.");
    }

    if (month < 1 || month > 12) {
        throw new Error("Please select a valid month.");
    }

    const replacements = createReplacementData(year, month);

    // Download and open the original DOCX template
    const templateBuffer = await fetchTemplate();
    const zip = await JSZip.loadAsync(templateBuffer);

    const documentFile = zip.file("word/document.xml");

    if (!documentFile) {
        throw new Error("word/document.xml was not found.");
    }

    // Read Word XML
    const documentXml = await documentFile.async("string");

    // Replace month, year and day placeholders
    let modifiedXml = replacePlaceholders(
        documentXml,
        replacements
    );

    // Apply A4 landscape orientation
    modifiedXml = setDocumentLandscape(modifiedXml);

    // Save the modified Word XML
    zip.file("word/document.xml", modifiedXml);

    // Generate the updated DOCX
    const blob = await zip.generateAsync({
        type: "blob",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    return {
        blob,
        year,
        month
    };
}


/* =====================================================
   DOWNLOAD BLOB
===================================================== */

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


/* =====================================================
   GENERATE DOCX
===================================================== */

async function generateDOCX() {

    try {

        setLoading(
            true
        );


        showMessage(
            "Generating DOCX...",
            false
        );


        const result =
            await createModifiedDocx();


        const monthName =
            THAI_MONTHS[
                result.month - 1
            ];


        const filename =
            `${OUTPUT_PREFIX}_${monthName}_${result.year + 543}.docx`;


        downloadBlob(
            result.blob,
            filename
        );


        showMessage(
            `DOCX downloaded: ${filename}`,
            false
        );

    }
    catch (
        error
    ) {

        console.error(
            error
        );


        showMessage(
            `Error: ${error.message}`,
            true
        );

    }
    finally {

        setLoading(
            false
        );

    }

}


/* =====================================================
   GENERATE PDF
===================================================== */


async function generatePDF() {
    let pages = [];

    try {
        setLoading(true);
        showMessage("Generating landscape PDF...", false);

        // Check required libraries
        if (
            typeof docx === "undefined" ||
            typeof docx.renderAsync !== "function"
        ) {
            throw new Error("docx-preview is not loaded.");
        }

        if (typeof html2canvas === "undefined") {
            throw new Error("html2canvas is not loaded.");
        }

        if (typeof window.jspdf === "undefined") {
            throw new Error("jsPDF is not loaded.");
        }

        // Create the modified DOCX
        // Invalid day columns should be removed inside
        // createModifiedDocx() before this step.
        const result = await createModifiedDocx();

        pdfRenderArea.innerHTML = "";
        pdfRenderArea.style.display = "block";
        pdfRenderArea.style.visibility = "visible";
        pdfRenderArea.style.background = "#ffffff";

        const arrayBuffer = await result.blob.arrayBuffer();

     
        // Render DOCX to HTML
        await docx.renderAsync(
            arrayBuffer,
            pdfRenderArea,
            null,
            {
                className: "docx",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                renderHeaders: true,
                renderFooters: true,
                renderFootnotes: true,
                renderEndnotes: true,
                useBase64URL: true
            }
        );

        await new Promise(resolve => setTimeout(resolve, 500));

        pages = Array.from(
            pdfRenderArea.querySelectorAll("section.docx")
        );

        if (pages.length === 0) {
            throw new Error("No rendered Word pages were found.");
        }

        // A4 landscape dimensions at approximately 96 DPI
        const pageWidthPx = 1122;
        const pageHeightPx = 794;

        // Configure each rendered Word page
        for (const page of pages) {
            page.style.setProperty(
                "width", `${pageWidthPx}px`, "important"
            );
            page.style.setProperty(
                "min-width", `${pageWidthPx}px`, "important"
            );
            page.style.setProperty(
                "height", `${pageHeightPx}px`, "important"
            );
            page.style.setProperty(
                "min-height", `${pageHeightPx}px`, "important"
            );
            page.style.setProperty(
                "max-width", "none", "important"
            );
            page.style.setProperty(
                "margin", "0", "important"
            );
            page.style.setProperty(
                "padding", "0", "important"
            );
            page.style.setProperty(
                "box-sizing", "border-box", "important"
            );
            page.style.setProperty(
                "background", "#ffffff", "important"
            );

            // Expand tables to the available page width
            page.querySelectorAll("table").forEach(table => {
                table.style.setProperty(
                    "width", "100%", "important"
                );
                table.style.setProperty(
                    "max-width", "100%", "important"
                );
                table.style.setProperty(
                    "box-sizing", "border-box", "important"
                );
            });
        }

        // Wait for images
        await Promise.all(
            Array.from(pdfRenderArea.querySelectorAll("img")).map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }

                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            })
        );

        // Create A4 landscape PDF
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
            compress: true
        });

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            console.log(
                `Capturing page ${i + 1}/${pages.length}`
            );

            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                logging: false,
                imageTimeout: 30000,
                width: pageWidthPx,
                height: pageHeightPx,
                windowWidth: pageWidthPx,
                windowHeight: pageHeightPx
            });

            if (i > 0) {
                pdf.addPage("a4", "landscape");
            }

            pdf.addImage(
                canvas.toDataURL("image/jpeg", 0.98),
                "JPEG",
                0,
                0,
                297,
                210,
                undefined,
                "FAST"
            );
        }

        const monthName = THAI_MONTHS[result.month - 1];

        const filename =
            `${OUTPUT_PREFIX}_${monthName}_${result.year + 543}.pdf`;

        pdf.save(filename);

        showMessage(`PDF downloaded: ${filename}`, false);

/* =====================================================
   WAIT
===================================================== */

function wait(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =====================================================
   TEMPLATE STATUS
===================================================== */

async function checkTemplate() {

    if (
        TEMPLATE_URL ===
        "YOUR_CLOUDINARY_DOCX_URL_HERE"
    ) {

        templateStatus.textContent =
            "Template URL not set";

        return;

    }


    try {

        const response =
            await fetch(
                TEMPLATE_URL,
                {
                    method:
                        "HEAD"
                }
            );


        if (
            response.ok
        ) {

            templateStatus.textContent =
                "Template ready";

        }
        else {

            templateStatus.textContent =
                "Template unavailable";

        }

    }
    catch (
        error
    ) {

        /*
            Some hosting configurations
            don't support HEAD.

            The actual GET during generation
            is what matters.
        */

        templateStatus.textContent =
            "Template configured";

    }

}


/* =====================================================
   LOADING STATE
===================================================== */

function setLoading(
    loading
) {

    generateDocxButton.disabled =
        loading;


    generatePdfButton.disabled =
        loading;


    if (
        loading
    ) {

        progress.classList.remove(
            "hidden"
        );

    }
    else {

        progress.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    isError
) {

    message.textContent =
        text;


    message.classList.remove(
        "hidden"
    );


    if (
        isError
    ) {

        message.style.background =
            "#f8e5e5";


        message.style.color =
            "#8a2222";

    }
    else {

        message.style.background =
            "#e8f5e9";


        message.style.color =
            "#256029";

    }

}


/* =====================================================
   EVENTS
===================================================== */

yearInput.addEventListener(
    "input",
    updatePreview
);


monthInput.addEventListener(
    "change",
    updatePreview
);


generateDocxButton.addEventListener(
    "click",
    generateDOCX
);


generatePdfButton.addEventListener(
    "click",
    generatePDF
);


/* =====================================================
   START
===================================================== */

initialize();
