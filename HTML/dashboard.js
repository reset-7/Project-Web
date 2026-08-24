

// ========================================
// LOAD EXCEL
// ========================================

async function loadDashboardData() {

    try {

        const response = await fetch(EXCEL_URL + "?t=" + Date.now(), {
            cache: "no-store"
        });
        
        if (!response.ok) {
            throw new Error("Cannot download Excel file");
        }

        const arrayBuffer = await response.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, {
            type: "array",
            cellDates: false
        });


        // ========================================
        // SHEET 1 = GAS TANK
        // ========================================

        const gasSheet = workbook.Sheets["Sheet1"];

        const gasData = XLSX.utils.sheet_to_json(gasSheet, {
            raw: false
        });


        // ========================================
        // SHEET 2 = LIQUID OXYGEN
        // ========================================

        const oxygenSheet = workbook.Sheets["Sheet2"];

        const oxygenData = XLSX.utils.sheet_to_json(oxygenSheet, {
            raw: false
        });


        console.log("Gas data:", gasData);
        console.log("Oxygen data:", oxygenData);


        // ========================================
        // GAS TANK
        // ========================================

        const latestGasDate = getLatestDate(gasData);

        console.log("LATEST GAS DATE:", latestGasDate);


        const latestGasData = gasData.filter(row =>
            sameDate(row["Date"], latestGasDate)
        );


        console.log("LATEST GAS DATA:", latestGasData);
/*   update progress bar                                                                       */
        updateCircularProgress(
            "large-total",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "large"
            )?.["Ready to use (Total)"] ?? 0,
            50
        );

        updateCircularProgress(
            "aluminium-total",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "aluminium"
            )?.["Ready to use (Total)"] ?? 0,
            10
        );

        updateCircularProgress(
            "medium-total",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "medium"
            )?.["Ready to use (Total)"] ?? 0,
            50
        );

        updateCircularProgress(
            "small-total",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "small"
            )?.["Empty tank "] ?? 0,
            30
        );
/* progress bar empty                                         */
        updateCircularProgress(
            "large-empty",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "large"
            )?.["Empty tank "] ?? 0,
            50
        );

        updateCircularProgress(
            "aluminium-empty",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "aluminium"
            )?.["Empty tank "] ?? 0,
            10
        );

        updateCircularProgress(
            "medium-empty",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "medium"
            )?.["Empty tank "] ?? 0,
            50
        );

        updateCircularProgress(
            "small-empty",
            latestGasData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "small"
            )?.["Empty tank "] ?? 0,
            30
        );

        updateGasDashboard(latestGasData);

        updateLastUpdated(latestGasDate);


        // ========================================
        // LIQUID OXYGEN
        // ========================================

        const latestOxygenDate = getLatestDate(oxygenData);

        console.log("LATEST OXYGEN DATE:", latestOxygenDate);


        const latestOxygenData = oxygenData.filter(row =>
            sameDate(row["Date"], latestOxygenDate)
        );


        console.log("LATEST OXYGEN DATA:", latestOxygenData);
/*  progress bar liquid oxygen                                       */
        updateCircularProgress(
            "oxygen-level",
            latestOxygenData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "liquid oxygen level"
            )?.["Value"] ?? 0,
            125
        );

        updateCircularProgress(
            "oxygen-pressure",
            latestOxygenData.find(row =>
                String(row["Lists"]).trim().toLowerCase() === "liquid oxygen pressure"
            )?.["Value"] ?? 0,
            12
        );

        updateOxygenDashboard(latestOxygenData);

    }

    catch (error) {

        console.error(
            "Error loading dashboard:",
            error
        );

    }

}


// ========================================
// GET LATEST DATE
// ========================================

function getLatestDate(data) {

    let latestDate = null;
    let latestKey = -1;


    data.forEach(row => {

        const value = row["Date"];

        if (!value) {
            return;
        }


        const key = getDateKey(value);

        if (key === null) {
            return;
        }


        if (key > latestKey) {

            latestKey = key;
            latestDate = value;

        }

    });


    return latestDate;
}


// ========================================
// GET DATE KEY
// ========================================

function getDateKey(value) {

    if (!value) {
        return null;
    }


    const text = String(value).trim();


    // ----------------------------------------
    // DD/MM/YYYY
    // ----------------------------------------

    const parts = text.split("/");


    if (parts.length !== 3) {
        return null;
    }


    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);


    if (
        Number.isNaN(day) ||
        Number.isNaN(month) ||
        Number.isNaN(year)
    ) {
        return null;
    }


    return (
        year * 10000 +
        month * 100 +
        day
    );

}


// ========================================
// COMPARE DATES
// ========================================

function sameDate(value, targetDate) {

    if (!value || !targetDate) {
        return false;
    }


    return (
        getDateKey(value) ===
        getDateKey(targetDate)
    );

}


// ========================================
// UPDATE LAST UPDATED
// ========================================

function updateLastUpdated(date) {

    if (!date) {
        return;
    }

    const text = String(date).trim();
    const parts = text.split("/");

    if (parts.length === 3) {

        const day = parts[1].padStart(2, "0");
        const month = parts[0].padStart(2, "0");
        const year = parts[2];

        document.getElementById("last-updated").textContent =
            `${day}/${month}/20${year}`;
        

    }
}


// ========================================
// UPDATE GAS TANK
// ========================================

function updateGasDashboard(data) {

    data.forEach(row => {

        const type =
            String(row["Lists"])
                .trim()
                .toLowerCase();


        let prefix = "";


        if (type === "large") {

            prefix = "large";

        }

        else if (type === "aluminium") {

            prefix = "aluminium";

        }

        else if (type === "medium") {

            prefix = "medium";

        }

        else if (type === "small") {

            prefix = "small";

        }

        else {

            return;

        }


        // ========================================
        // READY
        // ========================================

        const readyElement =
            document.getElementById(
                `${prefix}-ready`
            );


        if (readyElement) {

            readyElement.textContent =
                row["Ready to use (Total)"] ?? 0;

        }


        // ========================================
        // EMPTY
        // ========================================

        const emptyElement =
            document.getElementById(
                `${prefix}-empty`
            );


        if (emptyElement) {

            emptyElement.textContent =
                row["Empty tank "] ?? 0;

        }


        // ========================================
        // SPARE ROOM
        // ========================================

        const spareElement =
            document.getElementById(
                `${prefix}-spare`
            );


        if (spareElement) {

            spareElement.textContent =
                row["Spare Room"] ?? 0;

        }


        // ========================================
        // ER
        // ========================================

        const erElement =
            document.getElementById(
                `${prefix}-er`
            );


        if (erElement) {

            erElement.textContent =
                row["Patient Porter @ER"] ?? 0;

        }


        // ========================================
        // OPD
        // ========================================

        const opdElement =
            document.getElementById(
                `${prefix}-opd`
            );


        if (opdElement) {

            opdElement.textContent =
                row["Patient Porter @OPD 1st Floor"] ?? 0;

        }

    });

}


// ========================================
// UPDATE LIQUID OXYGEN
// ========================================

function updateOxygenDashboard(data) {

    if (!data || data.length === 0) {
        return;
    }


    data.forEach(row => {

        const type =
            String(row["Lists"])
                .trim()
                .toLowerCase();


        // ========================================
        // LEVEL
        // ========================================

        if (type === "liquid oxygen level") {

            const element =
                document.getElementById(
                    "oxygen-level"
                );


            if (element) {

                element.textContent =
                    row["Value"] ?? 0;

            }

        }


        // ========================================
        // PRESSURE
        // ========================================

        else if (type === "liquid oxygen pressure") {

            const element =
                document.getElementById(
                    "oxygen-pressure"
                );


            if (element) {

                element.textContent =
                    row["Value"] ?? 0;

            }

        }

    });

}


// ========================================
// START
// ========================================

loadDashboardData();

function updateCircularProgress(id, value, max) {

    const textElement =
        document.getElementById(id);

    const progressElement =
        document.getElementById(id + "-progress");

    if (!textElement || !progressElement) {
        return;
    }

    textElement.textContent = value;

    const circumference = 2 * Math.PI * 40;

    const percentage = Math.min(value / max, 1);

    const offset =
        circumference * (1 - percentage);

    progressElement.style.strokeDashoffset = offset;
}


