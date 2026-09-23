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


/* =====================================================
   CREATE MODIFIED DOCX
===================================================== */

async function createModifiedDocx() {

    const year =
        Number(
            yearInput.value
        );


    const month =
        Number(
            monthInput.value
        );


    /*
        Validate year.
    */

    if (
        !year ||
        year < 2000 ||
        year > 2100
    ) {

        throw new Error(
            "Please enter a valid year."
        );

    }


    /*
        Validate month.
    */

    if (
        month < 1 ||
        month > 12
    ) {

        throw new Error(
            "Please select a valid month."
        );

    }


    /*
        Create replacement values.
    */

    const replacements =
        createReplacementData(
            year,
            month
        );


    /*
        Download template.
    */

    const templateBuffer =
        await fetchTemplate();


    /*
        Open DOCX ZIP.
    */

    const zip =
        await JSZip.loadAsync(
            templateBuffer
        );


    /*
        Main Word XML.
    */

    const documentFile =
        zip.file(
            "word/document.xml"
        );


    if (
        !documentFile
    ) {

        throw new Error(
            "word/document.xml was not found."
        );

    }


    /*
        Read XML.
    */

    const documentXml =
        await documentFile.async(
            "string"
        );


    /*
        Replace placeholders.
    */

    const modifiedXml =
        replacePlaceholders(
            documentXml,
            replacements
        );


    /*
        Save modified XML.
    */

    zip.file(
        "word/document.xml",
        modifiedXml
    );


    /*
        Generate DOCX.
    */

    const blob =
        await zip.generateAsync(
            {
                type: "blob",

                mimeType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        );


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

    try {

        setLoading(true);

        showMessage(
            "Preparing PDF...",
            false
        );


        /* =========================================
           Check required libraries
        ========================================== */

        if (
            typeof docx === "undefined" ||
            typeof docx.renderAsync !== "function"
        ) {

            throw new Error(
                "DOCX preview library failed to load."
            );

        }


        if (
            typeof html2pdf === "undefined"
        ) {

            throw new Error(
                "PDF library failed to load."
            );

        }


        /* =========================================
           Generate modified DOCX
        ========================================== */

        const result =
            await createModifiedDocx();


        /* =========================================
           Clear previous rendering
        ========================================== */

        pdfRenderArea.innerHTML = "";


        /* =========================================
           Convert Blob
        ========================================== */

        const arrayBuffer =
            await result.blob.arrayBuffer();


        /* =========================================
           Render DOCX
        ========================================== */

        await docx.renderAsync(

            arrayBuffer,

            pdfRenderArea,

            undefined,

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


        /* =========================================
           Check rendered document
        ========================================== */

        const pages =
            pdfRenderArea.querySelectorAll(
                "section.docx"
            );


        console.log(
            "Rendered pages:",
            pages.length
        );


        if (
            pages.length === 0
        ) {

            throw new Error(
                "DOCX was generated, but no pages were rendered for PDF."
            );

        }


        /* =========================================
           Wait for layout
        ========================================== */

        await wait(1500);


        /* =========================================
           Wait for images
        ========================================== */

        const images =
            pdfRenderArea.querySelectorAll(
                "img"
            );


        await Promise.all(

            Array.from(images).map(
                img => {

                    if (
                        img.complete
                    ) {

                        return Promise.resolve();

                    }


                    return new Promise(
                        resolve => {

                            img.onload =
                                resolve;

                            img.onerror =
                                resolve;

                        }
                    );

                }
            )

        );


        /* =========================================
           Filename
        ========================================== */

        const monthName =
            THAI_MONTHS[
                result.month - 1
            ];


        const filename =
            `${OUTPUT_PREFIX}_${monthName}_${result.year + 543}.pdf`;


        /* =========================================
           PDF settings
        ========================================== */

        const pdfOptions = {

            margin: 0,

            filename: filename,

            image: {

                type: "jpeg",

                quality: 0.98

            },

            html2canvas: {

                scale: 2,

                useCORS: true,

                allowTaint: true,

                backgroundColor: "#ffffff",

                logging: true

            },

            jsPDF: {

                unit: "mm",

                format: "a4",

                orientation: "portrait"

            },

            pagebreak: {

                mode: [
                    "css",
                    "legacy"
                ]

            }

        };


        /* =========================================
           Generate PDF
        ========================================== */

        await html2pdf()

            .set(pdfOptions)

            .from(pdfRenderArea)

            .save();


        showMessage(
            `PDF downloaded: ${filename}`,
            false
        );

    }
    catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        showMessage(
            `PDF error: ${error.message}`,
            true
        );

    }
    finally {

        pdfRenderArea.innerHTML = "";

        setLoading(false);

    }

}

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
