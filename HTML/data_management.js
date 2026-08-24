
// ========================================
// IMPORT DATA
// ========================================

function importData() {

    const fileInput =
        document.getElementById(
            "import-file"
        );


    if (!fileInput) {

        alert(
            "Import file input not found."
        );

        return;
    }


    const file =
        fileInput.files[0];


    if (!file) {

        alert(
            "Please select an Excel file first."
        );

        return;
    }


    // ========================================
    // CHECK FILE TYPE
    // ========================================

    const fileName =
        file.name.toLowerCase();


    if (
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls")
    ) {

        alert(
            "Please select an Excel file (.xlsx or .xls)."
        );

        return;
    }


    // ========================================
    // READ EXCEL
    // ========================================

    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            try {

                const data =
                    new Uint8Array(
                        event.target.result
                    );


                const workbook =
                    XLSX.read(
                        data,
                        {
                            type: "array",
                            cellDates: false
                        }
                    );


                // ========================================
                // CHECK SHEET 1
                // ========================================

                if (
                    !workbook.SheetNames.includes(
                        "Sheet1"
                    )
                ) {

                    alert(
                        "Import failed: Sheet1 was not found."
                    );

                    return;
                }


                // ========================================
                // CHECK SHEET 2
                // ========================================

                if (
                    !workbook.SheetNames.includes(
                        "Sheet2"
                    )
                ) {

                    alert(
                        "Import failed: Sheet2 was not found."
                    );

                    return;
                }


                // ========================================
                // READ GAS
                // ========================================

                const gasData =
                    XLSX.utils.sheet_to_json(
                        workbook.Sheets["Sheet1"],
                        {
                            raw: false
                        }
                    );


                // ========================================
                // READ LIQUID OXYGEN
                // ========================================

                const oxygenData =
                    XLSX.utils.sheet_to_json(
                        workbook.Sheets["Sheet2"],
                        {
                            raw: false
                        }
                    );


                // ========================================
                // DEBUG
                // ========================================

                console.log(
                    "Imported Gas Data:",
                    gasData
                );


                console.log(
                    "Imported Oxygen Data:",
                    oxygenData
                );


                // ========================================
                // SUCCESS
                // ========================================

                alert(
                    "Excel file loaded successfully.\n\n" +
                    "File: " +
                    file.name +
                    "\n" +
                    "Gas rows: " +
                    gasData.length +
                    "\n" +
                    "Oxygen rows: " +
                    oxygenData.length
                );

            }

            catch (error) {

                console.error(
                    "Excel import error:",
                    error
                );


                alert(
                    "Cannot read the Excel file."
                );

            }

        };


    // ========================================
    // FILE READER ERROR
    // ========================================

    reader.onerror =
        function() {

            alert(
                "Cannot read the selected file."
            );

        };


    // ========================================
    // START READING
    // ========================================

    reader.readAsArrayBuffer(
        file
    );

}

// ========================================
// EXPORT DATA
// ========================================

async function exportData() {

    console.log(
        "EXPORT BUTTON CLICKED"
    );


    try {

        // ========================================
        // EXCEL URL
        // ========================================

        const url =
            EXCEL_URL +
            "?t=" +
            Date.now();


        console.log(
            "Downloading:",
            url
        );


        // ========================================
        // FETCH EXCEL
        // ========================================

        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        console.log(
            "Response:",
            response
        );


        // ========================================
        // CHECK RESPONSE
        // ========================================

        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        // ========================================
        // GET FILE
        // ========================================

        const blob =
            await response.blob();


        console.log(
            "File received:",
            blob.size,
            "bytes"
        );


        // ========================================
        // CREATE DOWNLOAD URL
        // ========================================

        const downloadURL =
            window.URL.createObjectURL(
                blob
            );


        // ========================================
        // CREATE DOWNLOAD LINK
        // ========================================

        const link =
            document.createElement(
                "a"
            );


        link.href =
            downloadURL;


        link.download =
            "Gas tank + Liquid Oxygen database.xlsx";


        link.style.display =
            "none";


        document.body.appendChild(
            link
        );


        // ========================================
        // DOWNLOAD
        // ========================================

        link.click();


        // ========================================
        // CLEAN UP
        // ========================================

        document.body.removeChild(
            link
        );


        window.URL.revokeObjectURL(
            downloadURL
        );


        console.log(
            "EXPORT SUCCESSFUL"
        );


    }

    catch (error) {

        console.error(
            "EXPORT ERROR:",
            error
        );


        alert(
            "Cannot export Excel file.\n\n" +
            error.message
        );

    }

}