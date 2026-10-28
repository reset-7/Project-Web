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



async function generatePDF() {
    let pdfRenderArea;

    try {
        setLoading(true);

        // Create the modified DOCX for the selected year and month
        const { blob, year, month } = await createModifiedDocx();

        // Prepare the temporary area for rendering
        pdfRenderArea = document.getElementById("pdfRenderArea");

        if (!pdfRenderArea) {
            throw new Error('Element with id "pdfRenderArea" was not found.');
        }

        pdfRenderArea.innerHTML = "";
        pdfRenderArea.style.display = "block";
        pdfRenderArea.style.visibility = "visible";
        pdfRenderArea.style.position = "absolute";
        pdfRenderArea.style.left = "-10000px";
        pdfRenderArea.style.top = "0";
        pdfRenderArea.style.background = "#ffffff";

        // Render the DOCX
        const arrayBuffer = await blob.arrayBuffer();

        await docx.renderAsync(
            arrayBuffer,
            pdfRenderArea,
            null,
            {
                className: "docx",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                breakPages: true,
                renderHeaders: true,
                renderFooters: true,
                renderFootnotes: true
            }
        );

        // Set A4 landscape dimensions in CSS pixels at 96 DPI
        const pageWidth = 1122;
        const pageHeight = 794;

        const pages = pdfRenderArea.querySelectorAll(
            ".docx-wrapper > section.docx, section.docx"
        );

        if (!pages.length) {
            throw new Error("No DOCX pages were rendered.");
        }

        // Prepare each page and its tables
        pages.forEach((page) => {
            page.style.width = `${pageWidth}px`;
            page.style.minWidth = `${pageWidth}px`;
            page.style.maxWidth = `${pageWidth}px`;
            page.style.height = `${pageHeight}px`;
            page.style.minHeight = `${pageHeight}px`;
            page.style.maxHeight = `${pageHeight}px`;
            page.style.margin = "0";
            page.style.padding = "0";
            page.style.boxSizing = "border-box";
            page.style.overflow = "hidden";
            page.style.background = "#ffffff";

            page.querySelectorAll("table").forEach((table) => {
                table.style.width = "100%";
                table.style.maxWidth = "100%";
                table.style.tableLayout = "fixed";
                table.style.borderCollapse = "collapse";
                table.style.boxSizing = "border-box";
            });
        });

        // Allow the browser to finish layout before capturing
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
            compress: true
        });

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: pageWidth,
                height: pageHeight,
                windowWidth: pageWidth,
                windowHeight: pageHeight,
                scrollX: 0,
                scrollY: 0
            });

            const imageData = canvas.toDataURL("image/jpeg", 0.95);

            if (i > 0) {
                pdf.addPage("a4", "landscape");
            }

            pdf.addImage(
                imageData,
                "JPEG",
                0,
                0,
                297,
                210,
                undefined,
                "FAST"
            );
        }

        // Download the PDF
        const filename = `daily-checklist-${year}-${String(month).padStart(2, "0")}.pdf`;

        pdf.save(filename);

        showMessage(
            `Landscape PDF downloaded: ${filename}`,
            false
        );

    } catch (error) {
        console.error("PDF ERROR:", error);

        showMessage(
            `PDF Error: ${error.message || error}`,
            true
        );

    } finally {
        if (pdfRenderArea) {
            pdfRenderArea.innerHTML = "";
            pdfRenderArea.style.display = "none";
            pdfRenderArea.style.visibility = "visible";
        }

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
