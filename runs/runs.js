const dataPath = document.currentScript.dataset.datapath;
let runs = fetch(`/runs/${dataPath}`)
    .then(response => response.json())
    .then(runs => {
        // Create a map of runs per year
        var runs_per_year = runs.reduce((acc, run) => {
            const date = new Date(run.date)
            const year = date.getFullYear();
            const day = date.toISOString().slice(0, 10);
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push({
                date: day,
                value: run.distance,
            });

            // we add the last day of the year (December 31, to the next year too)
            if (date.getMonth() == 11 && date.getDate() == 31) {
                if (!acc[year + 1]) {
                    acc[year + 1] = [];
                }

                acc[year + 1].push({
                    date: day,
                    value: run.distance,

                })
            }
            return acc;

        }, {});
        var runs_per_year = new Map(Object.entries(runs_per_year));


        for (const [year, runs] of runs_per_year.entries()) {
            // Show the header
            const header = document.getElementById(`activity-header-${year}`);
            header.style.display = 'block';

            // Get the number of runs this year
            const n_runs_current_year = runs.length;
            const total_run_distance = runs.reduce((total, run) => run.value / 1000 + total, 0).toFixed(1);
            const average_run_length = (total_run_distance / n_runs_current_year).toFixed(1);
            const longest_run = runs.reduce((max, run) => Math.max(max, run.value), 0);
            const runs_info_paragraph = document.createElement('p');
            runs_info_paragraph.innerHTML = `Number of runs: ${n_runs_current_year} <br>Total Distance: ${total_run_distance} kilometers <br>Average run length: ${average_run_length} kilometers <br>Longest run: ${longest_run} meters`;
            document.getElementById(`n-runs-current-${year}`).appendChild(runs_info_paragraph);

            // Create the heatmap
            const cal = new CalHeatmap();
            cal.paint(
                {
                    data: {
                        source: runs,
                        type: 'json',
                        x: 'date',
                        y: 'value',
                        groupY: 'max',
                    },
                    date: { start: new Date(`${year}-01-01`) },
                    range: 12,
                    scale: {
                        color: {
                            scheme: 'Oranges',
                            type: 'pow',
                            domain: [0, 10000],
                        }
                    },
                    domain: {
                        type: 'month',
                        gutter: 10,
                        label: { text: 'MMM', textAlign: 'start', position: 'top' },
                    },
                    subDomain: { type: 'ghDay', radius: 2, width: 11, height: 11, gutter: 4 },
                    itemSelector: `#activity-grid-${year}`,
                },
                [
                    [
                        Tooltip,
                        {
                            text: function (date, value, dayjsDate) {
                                return (
                                    (value ? value : '0') +
                                    ' meters ran on ' +
                                    dayjsDate.format('dddd, MMMM D, YYYY')
                                );
                            },
                        },
                    ],
                    [
                        CalendarLabel,
                        {
                            width: 30,
                            textAlign: 'start',
                            text: () => dayjs.weekdaysShort().map((d, i) => (i % 2 == 0 ? '' : d)),
                            padding: [25, 0, 0, 0],
                        },
                    ],
                ]
            );
        }
    })