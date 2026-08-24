// ========================================
// EXCEL FILE
// ========================================

// ========================================
// GLOBAL VARIABLES
// ========================================


let oxygenData = [];

let gasHistoryChart = null;
let oxygenHistoryChart = null;


// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadHistoryData();

    }
);


// ========================================
// LOAD EXCEL DATA
// ========================================

async function loadHistoryData() {

    try {

        const response =
            await fetch(
                EXCEL_URL + "?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Cannot download Excel file"
            );

        }


        const arrayBuffer =
            await response.arrayBuffer();


        const workbook =
            XLSX.read(
                arrayBuffer,
                {
                    type: "array",
                    cellDates: false
                }
            );


        // ========================================
        // GAS DATA
        // ========================================

        const gasSheet =
            workbook.Sheets["Sheet1"];


        if (!gasSheet) {

            throw new Error(
                "Sheet1 not found"
            );

        }


        gasData =
            XLSX.utils.sheet_to_json(
                gasSheet,
                {
                    raw: false
                }
            );


        // ========================================
        // LIQUID OXYGEN DATA
        // ========================================

        const oxygenSheet =
            workbook.Sheets["Sheet2"];


        if (!oxygenSheet) {

            throw new Error(
                "Sheet2 not found"
            );

        }


        oxygenData =
            XLSX.utils.sheet_to_json(
                oxygenSheet,
                {
                    raw: false
                }
            );


        console.log(
            "History Gas Data:",
            gasData
        );


        console.log(
            "History Oxygen Data:",
            oxygenData
        );


        // ========================================
        // UPDATE LAST UPDATED
        // ========================================

        updateLastUpdated();


        // ========================================
        // INITIAL GRAPH
        // ========================================

        applyHistoryFilter("all");

    }

    catch (error) {

        console.error(
            "History graph error:",
            error
        );

    }

}


// ========================================
// PARSE DATE
// ========================================

function parseDate(value) {

    if (!value) {
        return NaN;
    }


    const text =
        String(value).trim();


    const parts =
        text.split("/");


    // ========================================
    // M/D/YY
    // M/D/YYYY
    // M/D/2569
    // ========================================

    if (parts.length === 3) {

        const month =
            Number(parts[0]);

        const day =
            Number(parts[1]);

        let year =
            Number(parts[2]);


        if (
            !Number.isNaN(month) &&
            !Number.isNaN(day) &&
            !Number.isNaN(year)
        ) {

            // 26 → 2026
            if (year < 100) {

                year += 2000;

            }

            // 2569 → 2026
            else if (year >= 2400) {

                year -= 543;

            }


            return new Date(
                year,
                month - 1,
                day
            );

        }

    }


    // ========================================
    // NORMAL DATE
    // ========================================

    const date =
        new Date(value);


    if (!isNaN(date.getTime())) {

        return date;

    }


    return NaN;

}


// ========================================
// FORMAT DATE FOR GRAPH
// ========================================

function formatGraphDate(value) {

    const date =
        parseDate(value);


    if (isNaN(date.getTime())) {

        return value;

    }


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;

}


// ========================================
// LAST UPDATED
// ========================================

function updateLastUpdated() {

    const allDates = [

        ...gasData.map(
            row => row["Date"]
        ),

        ...oxygenData.map(
            row => row["Date"]
        )

    ];


    const validDates =
        allDates
            .map(date => parseDate(date))
            .filter(
                date =>
                    !isNaN(date.getTime())
            );


    if (validDates.length === 0) {

        return;

    }


    const latestDate =
        new Date(
            Math.max(
                ...validDates.map(
                    date =>
                        date.getTime()
                )
            )
        );


    const day =
        String(
            latestDate.getDate()
        ).padStart(2, "0");


    const month =
        String(
            latestDate.getMonth() + 1
        ).padStart(2, "0");


    const year =
        latestDate.getFullYear();


    const element =
        document.getElementById(
            "last-updated"
        );


    if (element) {

        element.textContent =
            `${day}/${month}/${year}`;

    }

}


// ========================================
// FILTER
// ========================================

function setHistoryFilter(days) {

    applyHistoryFilter(days);

}


// ========================================
// APPLY FILTER
// ========================================

function applyHistoryFilter(days) {

    // ========================================
    // ALL DATA
    // ========================================

    if (days === "all") {

        drawGasGraph(gasData);

        drawOxygenGraph(oxygenData);

        return;

    }


    const numberOfDays =
        Number(days);


    if (Number.isNaN(numberOfDays)) {

        return;

    }


    const allDates = [

        ...gasData.map(
            row =>
                parseDate(row["Date"])
        ),

        ...oxygenData.map(
            row =>
                parseDate(row["Date"])
        )

    ].filter(
        date =>
            !isNaN(date.getTime())
    );


    if (allDates.length === 0) {

        return;

    }


    const latestDate =
        new Date(
            Math.max(
                ...allDates.map(
                    date =>
                        date.getTime()
                )
            )
        );


    const startDate =
        new Date(latestDate);


    startDate.setDate(
        startDate.getDate() -
        numberOfDays + 1
    );


    drawGasGraph(
        filterDataByDate(
            gasData,
            startDate,
            latestDate
        )
    );


    drawOxygenGraph(
        filterDataByDate(
            oxygenData,
            startDate,
            latestDate
        )
    );

}


// ========================================
// FILTER BY DATE
// ========================================

function filterDataByDate(
    data,
    startDate,
    endDate
) {

    return data.filter(row => {

        const date =
            parseDate(
                row["Date"]
            );


        if (isNaN(date.getTime())) {

            return false;

        }


        return (
            date >= startDate &&
            date <= endDate
        );

    });

}


// ========================================
// SPECIFIC DATE FILTER
// ========================================

function applySpecificDateFilter() {

    const startInput =
        document.getElementById(
            "history-start-date"
        );


    const endInput =
        document.getElementById(
            "history-end-date"
        );


    if (
        !startInput.value ||
        !endInput.value
    ) {

        alert(
            "Please select both start and end dates."
        );

        return;

    }


    const startDate =
        new Date(
            startInput.value
        );


    const endDate =
        new Date(
            endInput.value
        );


    endDate.setHours(
        23,
        59,
        59,
        999
    );


    drawGasGraph(
        filterDataByDate(
            gasData,
            startDate,
            endDate
        )
    );


    drawOxygenGraph(
        filterDataByDate(
            oxygenData,
            startDate,
            endDate
        )
    );

}


// ========================================
// GAS GRAPH
// ========================================

function drawGasGraph(data) {

    const canvas =
        document.getElementById(
            "gas-history-chart"
        );


    if (!canvas) {

        console.error(
            "Gas graph canvas not found."
        );

        return;

    }


    if (gasHistoryChart) {

        gasHistoryChart.destroy();

    }


    // ========================================
    // GROUP DATA BY DATE
    // ========================================

    const grouped = {};


    data.forEach(row => {

        const date =
            row["Date"];


        if (!date) {
            return;
        }


        if (!grouped[date]) {

            grouped[date] = [];

        }


        grouped[date].push(row);

    });


    const dates =
        Object.keys(grouped)
            .sort(
                (a, b) =>
                    parseDate(a) -
                    parseDate(b)
            );


    // ========================================
    // GAS TYPES
    // ========================================

    const gasTypes = [

        "Large",
        "Aluminium",
        "Medium",
        "Small"

    ];


    const datasets =
        gasTypes.map(type => {

            return {

                label: type,

                data:
                    dates.map(date => {

                        const row =
                            grouped[date].find(
                                item =>
                                    String(
                                        item["Lists"]
                                    )
                                    .trim()
                                    .toLowerCase() ===
                                    type.toLowerCase()
                            );


                        if (!row) {

                            return null;

                        }


                        return Number(
                            row[
                                "Ready to use (Total)"
                            ]
                        ) || 0;

                    }),

                tension: 0.3,

                pointRadius: 5,

                pointHoverRadius: 8

            };

        });


    // ========================================
    // CREATE GAS CHART
    // ========================================

    gasHistoryChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        dates.map(
                            date =>
                                formatGraphDate(date)
                        ),

                    datasets:
                        datasets

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {

                        mode: "nearest",

                        intersect: true

                    },

                    plugins: {

                        legend: {

                            position: "top"

                        },

                        tooltip: {

                            callbacks: {

                                title:
                                    function(context) {

                                        return (
                                            "Date: " +
                                            context[0].label
                                        );

                                    },


                                label:
                                    function(context) {

                                        return (
                                            context.dataset.label +
                                            ": " +
                                            context.parsed.y +
                                            " tanks"
                                        );

                                    },

                                afterBody: function(context) {

                                    const index =
                                        context[0].dataIndex;

                                    const date =
                                        dates[index];

                                    const rows =
                                        grouped[date];

                                    // Get the gas type of the point being hovered
                                    const gasType =
                                        context[0].dataset.label;

                                    // Find only that gas type
                                    const row =
                                        rows.find(
                                            item =>
                                                String(
                                                    item["Lists"]
                                                )
                                                .trim()
                                                .toLowerCase() ===
                                                gasType.toLowerCase()
                                        );

                                    if (!row) {
                                        return [];
                                    }

                                    return [

                                        `Spare Room: ${
                                            row["Spare Room"] ?? 0
                                        }`,

                                        `Patient Porter @ER: ${
                                            row["Patient Porter @ER"] ?? 0
                                        }`,

                                        `Patient Porter @OPD 1st Floor: ${
                                            row["Patient Porter @OPD 1st Floor"] ?? 0
                                        }`,

                                        `Empty Tank @Spare Room: ${
                                            row["Empty tank "] ?? 0
                                        }`

                                    ];

                                }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text:
                                    "Amount of Tanks"

                            }

                        },


                        x: {

                            title: {

                                display: true,

                                text: "Date"

                            }

                        }

                    }

                }

            }
        );

}


// ========================================
// LIQUID OXYGEN GRAPH
// ========================================

function drawOxygenGraph(data) {

    const canvas =
        document.getElementById(
            "oxygen-history-chart"
        );


    if (!canvas) {

        console.error(
            "Oxygen graph canvas not found."
        );

        return;

    }


    if (oxygenHistoryChart) {

        oxygenHistoryChart.destroy();

    }


    // ========================================
    // GROUP BY DATE
    // ========================================

    const grouped = {};


    data.forEach(row => {

        const date =
            row["Date"];


        if (!date) {
            return;
        }


        if (!grouped[date]) {

            grouped[date] = [];

        }


        grouped[date].push(row);

    });


    const dates =
        Object.keys(grouped)
            .sort(
                (a, b) =>
                    parseDate(a) -
                    parseDate(b)
            );


    // ========================================
    // LEVEL
    // ========================================

    const levelData =
        dates.map(date => {

            const row =
                grouped[date].find(
                    item =>
                        String(
                            item["Lists"]
                        )
                        .trim()
                        .toLowerCase() ===
                        "liquid oxygen level"
                );


            if (!row) {

                return null;

            }


            return Number(
                row["Value"]
            ) || 0;

        });


    // ========================================
    // CREATE OXYGEN CHART
    // ========================================

    oxygenHistoryChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        dates.map(
                            date =>
                                formatGraphDate(date)
                        ),

                    datasets: [

                        {

                            label:
                                "Liquid Oxygen Level",

                            data:
                                levelData,

                            tension: 0.3,

                            pointRadius: 5,

                            pointHoverRadius: 8

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {

                        mode: "nearest",

                        intersect: true

                    },


                    plugins: {

                        legend: {

                            position: "top"

                        },


                        tooltip: {

                            callbacks: {

                                title:
                                    function(context) {

                                        return (
                                            "Date: " +
                                            context[0].label
                                        );

                                    },


                                label:
                                    function(context) {

                                        return (
                                            "Level: " +
                                            context.parsed.y +
                                            "%"
                                        );

                                    },


                                afterBody:
                                    function(context) {

                                        const index =
                                            context[0].dataIndex;


                                        const date =
                                            dates[index];


                                        const rows =
                                            grouped[date];


                                        const pressureRow =
                                            rows.find(
                                                item =>
                                                    String(
                                                        item["Lists"]
                                                    )
                                                    .trim()
                                                    .toLowerCase() ===
                                                    "liquid oxygen pressure"
                                            );


                                        if (
                                            pressureRow
                                        ) {

                                            return (
                                                "Pressure: " +
                                                pressureRow["Value"] +
                                                " bar"
                                            );

                                        }


                                        return "";

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text:
                                    "Level (%)"

                            }

                        },


                        x: {

                            title: {

                                display: true,

                                text: "Date"

                            }

                        }

                    }

                }

            }
        );

}
